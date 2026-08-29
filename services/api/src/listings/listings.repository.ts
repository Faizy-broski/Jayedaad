import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { TrackEngagementDto } from './dto/track-engagement.dto';
import { BoostListingDto } from './dto/boost-listing.dto';
import { Role } from '../common/types';
import { DocumentsService } from '../documents/documents.service';
import { EntitlementsService } from '../subscriptions/entitlements.service';
import { PaginationParams, resolvePagination, sanitizeKeyword } from '../common/pagination';

// A spent Hot/Super Hot credit boosts a listing for this long before
// PlanLifecycleService's cron reverts it to 'basic' — one billing cycle,
// matching the "N credits per month" allotment model.
const BOOST_DURATION_DAYS = 30;

// A spent Story credit (POST /listings/:id/story) features a listing for
// this long — Zameen's own Story product is a 24-hour placement, unlike
// Hot/Super Hot's month-long boost window.
const STORY_DURATION_HOURS = 24;

export type ListingDocumentType = 'id_card_front' | 'id_card_back' | 'ownership_proof' | 'utility_bill';

// id_card_front/id_card_back moved to the one-time owner identity
// verification flow (owner_identity_documents, see owners module) — the
// per-listing requirement is now just proof of ownership for that specific
// property. The two enum values stay in ListingDocumentType for schema
// compatibility with any already-uploaded rows.
export const REQUIRED_LISTING_DOCUMENT_TYPES: ListingDocumentType[] = ['ownership_proof', 'utility_bill'];

// Confirmed real on the Profolio "My Listings" filter panel: Listing ID,
// Category (property_type_categories) and Property Type (property_types) as
// two separate filters, Purpose, Listed Date range, Price range, Area
// range — a rich filter set that didn't exist at all for "my listings" before.
export interface MyListingsFilters {
  status?: 'draft' | 'pending_verification' | 'verified' | 'rejected' | 'expired' | 'deleted' | 'downgraded' | 'inactive';
  // Super Admin's Listings page's real 3-way split: Owner (posted as a
  // personal, non-professional listing), Agent (an independent agent, no
  // agency — carries its own ownership/utility-bill documents), Agency (an
  // agency-affiliated agent's listings, covered by the agency's own
  // documents instead — see AgentsPage's document-completeness exemption).
  // Backed by the stored listings.poster_type column (see the poster_type
  // migration), not a derived agent_id/agency_id join — replaces the old
  // 2-bucket source: 'owner_agent' | 'agency' split, which lumped Owner and
  // independent Agent together. Filtered server-side (not client-side over
  // one page) so pagination and totals stay correct at real scale.
  posterType?: 'owner' | 'agent' | 'agency';
  // A category slug — property_type_categories is Super Admin-managed data
  // now, not a fixed enum, so this is deliberately `string`, not a union.
  propertyTypeCategory?: string;
  propertyTypeSlug?: string;
  purpose?: 'sale' | 'rent';
  listingId?: string;
  listingNumber?: number;
  city?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  minAreaValue?: number;
  maxAreaValue?: number;
  areaUnit?: 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre';
  listedDateFrom?: string;
  listedDateTo?: string;
  // Agency Admin-only (mirrors LeadsRepository.list's identical filter) —
  // widens "my listings" from "just my own" to "every associate's listings
  // in my agency". Silently ignored (falls back to own-agent scope) for a
  // non-admin agent or any other role, same "ignored, not rejected"
  // discipline as the rest of this filter set.
  scope?: 'own' | 'agency';
  page?: number;
  pageSize?: number;
}

export interface MyListingsScope {
  userId: string;
  role: Role;
  agentId?: string;
}

export interface ListingSearchFilters {
  listingId?: string;
  listingNumber?: number;
  city?: string;
  area?: string;
  propertyTypeSlug?: string;
  purpose?: 'sale' | 'rent';
  bedrooms?: number;
  minBathrooms?: number;
  minAreaValue?: number;
  maxAreaValue?: number;
  areaUnit?: 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre';
  // Price range — Zameen's primary filter, confirmed on the real search page
  // but never actually implemented until this pass.
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
  furnishingStatus?: 'unfurnished' | 'semi_furnished' | 'furnished';
  hasVideo?: boolean;
  agencySlug?: string;
  // Backed by the stored listings.poster_type column — see MyListingsFilters
  // for the full 3-way (owner/agent/agency) explanation.
  posterType?: 'owner' | 'agent' | 'agency';
  sortBy?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
  // Internal-only — not exposed on the public GET /listings query string.
  // Used by SavedSearchAlertsService to find listings created since a saved
  // search's last notification, same pattern as findMine()'s listedDateFrom.
  createdAfter?: string;
}

export interface PaginatedListings {
  items: ReturnType<typeof mapPublicListingRow>[];
  total: number;
  page: number;
  pageSize: number;
}

function applySort(query: any, sortBy: ListingSearchFilters['sortBy']) {
  switch (sortBy) {
    case 'newest':
      return query.order('created_at', { ascending: false });
    case 'price_asc':
      return query.order('price', { ascending: true });
    case 'price_desc':
      return query.order('price', { ascending: false });
    case 'relevance':
    default:
      // Boost tier first (super_hot -> hot -> premium -> basic, per the
      // enum's declaration order), then a spent refresh credit (POST
      // /listings/:id/refresh bumps refreshed_at to now(), nulls-last so
      // listings never refreshed fall through to recency), then recency —
      // mirrors Zameen's real ranking: paid "Value Booster" placements rank
      // above organic listings, and a refresh bumps a listing back toward
      // the top within its own boost tier without granting a new tier.
      return query
        .order('boost_tier', { ascending: false })
        .order('refreshed_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
  }
}

const PUBLIC_LISTING_COLUMNS = `
  id, listing_number, title, description, price, purpose, city, area, society, sub_area,
  latitude, longitude, bedrooms, bathrooms, kitchens, floors, area_value,
  area_unit, year_built, floor_level, furnishing_status, boost_tier, boost_expires_at, refreshed_at, story_expires_at, expires_at,
  installment_available, ready_for_possession,
  advance_amount, number_of_installments, monthly_installment,
  balloon_payment_available, balloon_payment_amount,
  balloting_fee_applicable, balloting_fee_amount,
  possession_fee_applicable, possession_fee_amount,
  development_fee_applicable, development_fee_amount,
  status, poster_type, created_at,
  property_types!inner (slug, label, property_type_categories (slug, label)),
  listing_media (url, type, compressed_url, is_cover, sort_order, category),
  listing_amenities (value, text_value, amenities (slug, label, category, value_type, value_unit, options)),
  listing_contact_numbers (type, country_code, number),
  agent_profiles (
    id, user_id, display_name, photo_url,
    agencies (name, slug, logo_url),
    subscriptions (status, subscription_tiers (name))
  )
`;
// internal_notes deliberately excluded — allow-list selection, not a
// deny-list, so a future column addition can't leak it to the public API.

// Per blueprint §4.2: unverified listings must never be reachable via the
// public API. That guarantee lives HERE, in the repository method itself —
// there is no parameter on findPublic() that can widen the filter.
@Injectable()
export class ListingsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly documents: DocumentsService,
    private readonly entitlements: EntitlementsService,
  ) {}

  // requesterId (if the caller is authenticated) is attached to the
  // search_queries log row — [Reqs §4.2] "most-searched user queries", a
  // table that has existed since the first migration with nothing writing to it.
  async findPublic(filters: ListingSearchFilters = {}, requesterId?: string): Promise<PaginatedListings> {
    const { page, pageSize, from, to } = resolvePagination(filters);

    // Existence-filter pre-lookups. Done as separate queries (not an
    // embedded !inner filter) so they don't distort the `media`/agent
    // columns actually returned by the main select.
    let videoListingIds: string[] | undefined;
    if (filters.hasVideo) {
      const { data, error } = await this.supabase.client.from('listing_media').select('listing_id').eq('type', 'video');
      if (error) throw error;
      videoListingIds = Array.from(new Set((data ?? []).map((r: any) => r.listing_id)));
      if (videoListingIds.length === 0) {
        this.logSearchQuery(filters, requesterId);
        return { items: [], total: 0, page, pageSize };
      }
    }

    let agencyAgentIds: string[] | undefined;
    if (filters.agencySlug) {
      const { data: agency, error: agencyError } = await this.supabase.client
        .from('agencies')
        .select('id')
        .eq('slug', filters.agencySlug)
        .maybeSingle();
      if (agencyError) throw agencyError;
      if (!agency) {
        this.logSearchQuery(filters, requesterId);
        return { items: [], total: 0, page, pageSize };
      }
      const { data: agentRows, error: agentError } = await this.supabase.client
        .from('agent_profiles')
        .select('id')
        .eq('agency_id', agency.id);
      if (agentError) throw agentError;
      agencyAgentIds = (agentRows ?? []).map((r: any) => r.id);
      if (agencyAgentIds.length === 0) {
        this.logSearchQuery(filters, requesterId);
        return { items: [], total: 0, page, pageSize };
      }
    }

    let query = this.supabase.client
      .from('listings')
      .select(PUBLIC_LISTING_COLUMNS, { count: 'exact' })
      .eq('status', 'verified');

    if (filters.listingId) query = query.eq('id', filters.listingId);
    if (filters.listingNumber) query = query.eq('listing_number', filters.listingNumber);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.area) query = query.eq('area', filters.area);
    if (filters.propertyTypeSlug) query = query.eq('property_types.slug', filters.propertyTypeSlug);
    if (filters.purpose) query = query.eq('purpose', filters.purpose);
    // "N+" everywhere it's rendered (web's PropertyFilters/HeroSearchCard
    // chips) — an exact .eq() here silently hid every listing with MORE
    // bedrooms than the picked count, the opposite of what "3+" promises.
    // minBathrooms below already used .gte(); this just matches it.
    if (filters.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
    if (filters.minBathrooms) query = query.gte('bathrooms', filters.minBathrooms);
    // areaUnit is only meaningful alongside an actual area range — clients
    // (web/mobile search filter state) always carry a default unit
    // ('marla') even when the user never touched the area filter, so
    // applying it unconditionally silently excluded every listing measured
    // in a different unit (e.g. sqft/kanal) from an otherwise-unfiltered
    // search.
    if (filters.areaUnit && (filters.minAreaValue || filters.maxAreaValue)) query = query.eq('area_unit', filters.areaUnit);
    if (filters.minAreaValue) query = query.gte('area_value', filters.minAreaValue);
    if (filters.maxAreaValue) query = query.lte('area_value', filters.maxAreaValue);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.furnishingStatus) query = query.eq('furnishing_status', filters.furnishingStatus);
    if (filters.createdAfter) query = query.gte('created_at', filters.createdAfter);
    if (filters.keyword) {
      const term = sanitizeKeyword(filters.keyword);
      if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }
    if (filters.posterType) query = query.eq('poster_type', filters.posterType);
    if (videoListingIds) query = query.in('id', videoListingIds);
    if (agencyAgentIds) query = query.in('agent_id', agencyAgentIds);

    query = applySort(query, filters.sortBy).range(from, to);

    // Logging runs concurrently with the main query, not before it — an
    // analytics-log failure must never break or slow down an actual search.
    const [{ data, error, count }] = await Promise.all([query, this.logSearchQuery(filters, requesterId)]);
    if (error) throw error;

    return {
      items: (data ?? []).map(mapPublicListingRow),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  private async logSearchQuery(filters: ListingSearchFilters, userId?: string): Promise<void> {
    const { page: _page, pageSize: _pageSize, sortBy: _sortBy, keyword, ...structuredFilters } = filters;
    try {
      await this.supabase.client.from('search_queries').insert({
        query_text: keyword ?? '',
        user_id: userId ?? null,
        structured_filters: structuredFilters,
      });
    } catch {
      // Analytics logging is best-effort — never let it fail a search request.
    }
  }

  // Fixes the "table exists, nothing writes to it" gap found on
  // listing_engagement_events (formerly listing_views) — the same issue
  // search_queries had before the Search pass. Called by clients whenever a
  // view/click/call/whatsapp/sms/email interaction happens on a listing.
  async trackEngagement(listingId: string, input: TrackEngagementDto) {
    const { error } = await this.supabase.client.from('listing_engagement_events').insert({
      listing_id: listingId,
      type: input.type,
      platform: input.platform,
      viewer_session_id: input.viewerSessionId,
    });
    if (error) throw error;
  }

  // Powers the hierarchical City -> Area location picker seen on the real
  // Zameen search page — nothing populated this before. Deduped client-side;
  // fine at MVP scale, worth a dedicated distinct-values view/materialized
  // table once listing volume is real.
  async listCities(): Promise<string[]> {
    const { data, error } = await this.supabase.client.from('listings').select('city').eq('status', 'verified');
    if (error) throw error;
    return Array.from(new Set((data ?? []).map((r: any) => r.city as string))).sort();
  }

  async listAreas(city: string): Promise<string[]> {
    const { data, error } = await this.supabase.client
      .from('listings')
      .select('area')
      .eq('status', 'verified')
      .eq('city', city);
    if (error) throw error;
    return Array.from(new Set((data ?? []).map((r: any) => r.area as string))).sort();
  }

  // status is always forced to pending_verification here — the DTO has no
  // status field, so there is no code path where a submission could arrive
  // pre-verified [Spec §7]. The one narrow exception is `status: 'draft'`,
  // only ever passed by ListingsController's dedicated POST /listings/draft
  // path — never reachable from the public create() endpoint's DTO.
  // Re-derives/validates the authoritative poster_type server-side — never
  // trusts the client's CreateListingDto/UpdateListingDto value as-is. No
  // assigned agent (a plain requester) can only ever post as 'owner'. An
  // agent chooses between 'owner' and whichever of 'agent'/'agency' matches
  // their own agency_id — the DB trigger from the poster_type migration is
  // the final backstop for any write path that bypasses this.
  private async resolvePosterType(
    agentId: string | null | undefined,
    requested: 'owner' | 'agent' | 'agency' | undefined,
  ): Promise<'owner' | 'agent' | 'agency'> {
    if (!agentId) return 'owner';

    const { data: agentProfile, error } = await this.supabase.client
      .from('agent_profiles')
      .select('agency_id')
      .eq('id', agentId)
      .single();
    if (error) throw error;

    const isAgencyAffiliated = !!agentProfile.agency_id;
    const allowed: Array<'owner' | 'agent' | 'agency'> = isAgencyAffiliated ? ['owner', 'agency'] : ['owner', 'agent'];
    const fallback = isAgencyAffiliated ? 'agency' : 'agent';

    if (requested === undefined) return fallback;
    if (!allowed.includes(requested)) {
      throw new BadRequestException(
        isAgencyAffiliated
          ? 'You can only post as Owner or Agency — your agent profile is linked to an agency.'
          : 'You can only post as Owner or Agent — link your agent profile to an agency to post as Agency.',
      );
    }
    return requested;
  }

  async create(input: CreateListingDto & { ownerId: string; agentId?: string; status?: 'draft' | 'pending_verification' }) {
    // Per-room photo counts (getRequiredMediaCategories) are no longer a
    // hard gate here — product decision: a listing can be submitted with
    // any amount of media, including none. The category minimums still
    // exist and are shown as guidance client-side (packages/core's own
    // copy of getRequiredMediaCategories), just never block. Previously a
    // BadRequestException here mirrored the Document Verification Phase 4
    // spec's "mandatory photos" requirement.

    // Real quota enforcement — EntitlementsService.canCreateListing()
    // existed but was dead code before this pass (only GET
    // /subscriptions/usage ever called the read side of it). Only
    // agent-submitted listings are subscription-gated; an owner submitting
    // their own property has no plan to check against. Drafts are exempt
    // entirely — the quota is a limit on live/submitted listings, not on
    // how many unfinished drafts an agent can keep around (an agent should
    // be able to draft freely and only hits the plan limit when actually
    // submitting for verification via POST /listings/:id/submit).
    if (input.agentId && input.status !== 'draft') {
      const allowed = await this.entitlements.canCreateListing(input.agentId);
      if (!allowed) {
        throw new ForbiddenException('Listing quota reached for your current plan — upgrade or free up a slot.');
      }
    }

    const posterType = await this.resolvePosterType(input.agentId, input.posterType);

    const { data: listing, error } = await this.supabase.client
      .from('listings')
      .insert({
        owner_id: input.ownerId,
        agent_id: input.agentId,
        poster_type: posterType,
        property_type_id: input.propertyTypeId,
        purpose: input.purpose,
        title: input.title,
        description: input.description,
        price: input.price,
        city: input.city,
        area: input.area,
        society: input.society,
        sub_area: input.subArea,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        kitchens: input.kitchens,
        floors: input.floors,
        area_value: input.areaValue,
        area_unit: input.areaUnit,
        year_built: input.yearBuilt,
        floor_level: input.floorLevel,
        furnishing_status: input.furnishingStatus,
        installment_available: input.installmentAvailable ?? false,
        ready_for_possession: input.readyForPossession ?? false,
        advance_amount: input.advanceAmount,
        number_of_installments: input.numberOfInstallments,
        monthly_installment: input.monthlyInstallment,
        balloon_payment_available: input.balloonPaymentAvailable ?? false,
        balloon_payment_amount: input.balloonPaymentAmount,
        balloting_fee_applicable: input.ballotingFeeApplicable ?? false,
        balloting_fee_amount: input.ballotingFeeAmount,
        possession_fee_applicable: input.possessionFeeApplicable ?? false,
        possession_fee_amount: input.possessionFeeAmount,
        development_fee_applicable: input.developmentFeeApplicable ?? false,
        development_fee_amount: input.developmentFeeAmount,
        status: input.status ?? 'pending_verification',
        // boost_tier omitted — defaults to 'basic' in the DB; it's a paid
        // promotion, never client-settable at submission time.
      })
      .select()
      .single();
    if (error) throw error;

    if (input.contactNumbers?.length) {
      const { error: contactError } = await this.supabase.client.from('listing_contact_numbers').insert(
        input.contactNumbers.map((contact) => ({
          listing_id: listing.id,
          type: contact.type,
          country_code: contact.countryCode ?? '+92',
          number: contact.number,
        })),
      );
      if (contactError) throw contactError;
    }

    if (input.amenities?.length) {
      await this.addListingAmenities(listing.id, input.propertyTypeId, input.amenities);
    }

    if (input.media?.length) {
      // Exactly one cover: if the client didn't mark one, the first item
      // wins — mirrors how the submit form defaults cover to the first
      // uploaded photo.
      const hasCover = input.media.some((m) => m.isCover);
      const { error: mediaError } = await this.supabase.client.from('listing_media').insert(
        input.media.map((m, index) => ({
          listing_id: listing.id,
          url: m.url,
          type: m.type,
          is_cover: m.isCover ?? (!hasCover && index === 0),
          sort_order: m.sortOrder ?? index,
          category: m.category ?? null,
        })),
      );
      if (mediaError) throw mediaError;
    }

    return listing;
  }

  // The write path that never existed until now — an agent could create a
  // listing but never edit or self-delete it afterward. Ownership is
  // enforced at the controller (mirrors create()/documents' discipline);
  // this trusts its caller. Business rule: editing a REJECTED listing
  // resets it to pending_verification — content changes there genuinely
  // need a fresh look. A VERIFIED listing keeps its status through edits
  // instead (routine updates to something already live shouldn't force it
  // back through review) — it only ever leaves 'verified' via its
  // plan-driven expiry (PlanLifecycleService.expireListings()'s hourly
  // sweep against expires_at), which this method never touches. A listing
  // still pending stays pending. amenities/media/contactNumbers are
  // replace-in-full when provided (delete-then-reinsert), same approach
  // create() uses for the initial insert.
  async update(listingId: string, input: UpdateListingDto) {
    const { data: existing, error: existingError } = await this.supabase.client
      .from('listings')
      .select('status, property_type_id, agent_id')
      .eq('id', listingId)
      .single();
    if (existingError) throw existingError;

    const nextStatus = existing.status === 'rejected' ? 'pending_verification' : existing.status;

    const updatePayload: Record<string, unknown> = { status: nextStatus };
    if (input.posterType !== undefined) {
      updatePayload.poster_type = await this.resolvePosterType(existing.agent_id, input.posterType);
    }
    const fieldMap: Record<string, unknown> = {
      property_type_id: input.propertyTypeId,
      purpose: input.purpose,
      title: input.title,
      description: input.description,
      price: input.price,
      city: input.city,
      area: input.area,
      society: input.society,
      sub_area: input.subArea,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      kitchens: input.kitchens,
      floors: input.floors,
      area_value: input.areaValue,
      area_unit: input.areaUnit,
      year_built: input.yearBuilt,
      floor_level: input.floorLevel,
      furnishing_status: input.furnishingStatus,
      installment_available: input.installmentAvailable,
      ready_for_possession: input.readyForPossession,
      advance_amount: input.advanceAmount,
      number_of_installments: input.numberOfInstallments,
      monthly_installment: input.monthlyInstallment,
      balloon_payment_available: input.balloonPaymentAvailable,
      balloon_payment_amount: input.balloonPaymentAmount,
      balloting_fee_applicable: input.ballotingFeeApplicable,
      balloting_fee_amount: input.ballotingFeeAmount,
      possession_fee_applicable: input.possessionFeeApplicable,
      possession_fee_amount: input.possessionFeeAmount,
      development_fee_applicable: input.developmentFeeApplicable,
      development_fee_amount: input.developmentFeeAmount,
    };
    for (const [column, value] of Object.entries(fieldMap)) {
      if (value !== undefined) updatePayload[column] = value;
    }

    const { error: updateError } = await this.supabase.client.from('listings').update(updatePayload).eq('id', listingId);
    if (updateError) throw updateError;

    if (input.contactNumbers) {
      const { error: deleteContactsError } = await this.supabase.client
        .from('listing_contact_numbers')
        .delete()
        .eq('listing_id', listingId);
      if (deleteContactsError) throw deleteContactsError;
      if (input.contactNumbers.length) {
        const { error: contactError } = await this.supabase.client.from('listing_contact_numbers').insert(
          input.contactNumbers.map((contact) => ({
            listing_id: listingId,
            type: contact.type,
            country_code: contact.countryCode ?? '+92',
            number: contact.number,
          })),
        );
        if (contactError) throw contactError;
      }
    }

    if (input.amenities) {
      const { error: deleteAmenitiesError } = await this.supabase.client
        .from('listing_amenities')
        .delete()
        .eq('listing_id', listingId);
      if (deleteAmenitiesError) throw deleteAmenitiesError;
      if (input.amenities.length) {
        const propertyTypeId = input.propertyTypeId ?? existing.property_type_id;
        await this.addListingAmenities(listingId, propertyTypeId, input.amenities);
      }
    }

    if (input.media) {
      const { error: deleteMediaError } = await this.supabase.client.from('listing_media').delete().eq('listing_id', listingId);
      if (deleteMediaError) throw deleteMediaError;
      if (input.media.length) {
        const hasCover = input.media.some((m) => m.isCover);
        const { error: mediaError } = await this.supabase.client.from('listing_media').insert(
          input.media.map((m, index) => ({
            listing_id: listingId,
            url: m.url,
            type: m.type,
            is_cover: m.isCover ?? (!hasCover && index === 0),
            sort_order: m.sortOrder ?? index,
            category: m.category ?? null,
          })),
        );
        if (mediaError) throw mediaError;
      }
    }

    const { data: updated, error: refetchError } = await this.supabase.client
      .from('listings')
      .select(PUBLIC_LISTING_COLUMNS)
      .eq('id', listingId)
      .single();
    if (refetchError) throw refetchError;
    return mapPublicListingRow(updated);
  }

  // Hard gate — only amenities linked to this listing's property-type
  // category (via amenity_property_type_categories) are accepted, e.g. a
  // Plot submission can't select Drawing Room. Confirmed a real gap: every
  // amenity used to be selectable for every property type regardless of
  // relevance.
  private async addListingAmenities(
    listingId: string,
    propertyTypeId: string,
    amenities: { slug: string; value?: number; textValue?: string }[],
  ) {
    const { data: propertyType, error: propertyTypeError } = await this.supabase.client
      .from('property_types')
      .select('category_id')
      .eq('id', propertyTypeId)
      .single();
    if (propertyTypeError) throw propertyTypeError;

    const slugs = amenities.map((a) => a.slug);
    const { data: amenityRows, error: amenitiesError } = await this.supabase.client
      .from('amenities')
      .select('id, slug, amenity_property_type_categories (property_type_category_id)')
      .in('slug', slugs);
    if (amenitiesError) throw amenitiesError;

    const amenityBySlug = new Map((amenityRows ?? []).map((row: any) => [row.slug, row]));

    const invalidSlugs = slugs.filter((slug) => {
      const row = amenityBySlug.get(slug);
      if (!row) return true;
      const linkedCategoryIds = (row.amenity_property_type_categories ?? []).map(
        (link: any) => link.property_type_category_id,
      );
      return !linkedCategoryIds.includes(propertyType.category_id);
    });
    if (invalidSlugs.length > 0) {
      throw new BadRequestException(
        `These amenities don't apply to this property type: ${invalidSlugs.join(', ')}`,
      );
    }

    const { error: linkError } = await this.supabase.client.from('listing_amenities').insert(
      amenities.map((a) => ({
        listing_id: listingId,
        amenity_id: amenityBySlug.get(a.slug)!.id,
        value: a.value,
        text_value: a.textValue,
      })),
    );
    if (linkError) throw linkError;
  }

  // The property detail page itself — confirmed real via a scraped Zameen
  // listing detail page, and a genuine gap: nothing fetched a single
  // listing by id before this. Same "verified-only" restriction as
  // findPublic() [blueprint §4.2]: unverified listings must never be
  // reachable via the public API.
  async findById(listingId: string) {
    // .maybeSingle() (not .single()) — a listing that's been deleted,
    // rejected, or otherwise moved off 'verified' since a client last saw
    // it (e.g. mobile's on-device "Recently Viewed" cache, which snapshots
    // a listing at view time and never revalidates it) legitimately
    // matches zero rows here. .single() treats that as a Postgrest error
    // ("no rows returned"), which isn't an HttpException and previously
    // fell through to a raw 500 via AllExceptionsFilter instead of a clean
    // 404 — same "surface a real 4xx instead of an opaque 500" fix already
    // applied to users.repository.ts::create's duplicate-email case.
    const { data, error } = await this.supabase.client
      .from('listings')
      .select(PUBLIC_LISTING_COLUMNS)
      .eq('id', listingId)
      .eq('status', 'verified')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('This listing is no longer available.');

    const mapped = mapPublicListingRow(data);
    // Real agent email, resolved only here (single-listing detail), not in
    // findPublic()/search results — an admin API call per row across a
    // whole search response would be a real N+1. Unlike developers (a plain
    // admin-managed catalog with no login), an agent is always a real auth
    // account, so this is always a genuine email, never a fake/generic one
    // — AgentCard.tsx's Email quick-action can show it unconditionally.
    const userId = (data as any)?.agent_profiles?.user_id;
    if (mapped.agent && userId) {
      const { data: userData } = await this.supabase.client.auth.admin.getUserById(userId);
      return { ...mapped, agent: { ...mapped.agent, email: userData?.user?.email ?? null } };
    }
    return { ...mapped, agent: mapped.agent ? { ...mapped.agent, email: null } : null };
  }

  // "Similar properties" section seen on real Zameen detail pages — computed
  // at query time (same city + property type, excluding the listing itself),
  // not a stored relation.
  async findSimilar(listingId: string, limit = 6) {
    // .maybeSingle() — same reasoning as findById above. No status filter
    // here deliberately (a listing that's since been deleted/rejected can
    // still resolve its city/property_type_id for this query), but a
    // wholly nonexistent id still needs a clean 404, not a raw Postgrest
    // "no rows" error surfacing as a 500.
    const { data: current, error: currentError } = await this.supabase.client
      .from('listings')
      .select('city, property_type_id')
      .eq('id', listingId)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new NotFoundException('This listing is no longer available.');

    const { data, error } = await this.supabase.client
      .from('listings')
      .select(PUBLIC_LISTING_COLUMNS)
      .eq('status', 'verified')
      .eq('city', current.city)
      .eq('property_type_id', current.property_type_id)
      .neq('id', listingId)
      .order('boost_tier', { ascending: false })
      .order('refreshed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapPublicListingRow);
  }

// Sitewide "most visited" ranking — listing_engagement_events has been
  // capturing real 'view' rows since trackEngagement() was wired up (see
  // above) but nothing ever queried them back per-listing before this;
  // the only existing reader (AgentsRepository.getAnalytics) sums views
  // per-agent, not per-listing. Counted client-side rather than a SQL
  // GROUP BY, same pragmatic style already used in listCities()/
  // listAreas() above — fine at MVP event volume, worth a materialized
  // view once it isn't.
  async findMostViewed(limit = 12) {
    const { data: events, error: eventsError } = await this.supabase.client
      .from('listing_engagement_events')
      .select('listing_id')
      .eq('type', 'view');
    if (eventsError) throw eventsError;

    const viewCounts = new Map<string, number>();
    for (const row of events ?? []) {
      viewCounts.set(row.listing_id, (viewCounts.get(row.listing_id) ?? 0) + 1);
    }
    if (viewCounts.size === 0) return [];

    const topIds = Array.from(viewCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([listingId]) => listingId);

    const { data, error } = await this.supabase.client
      .from('listings')
      .select(PUBLIC_LISTING_COLUMNS)
      .eq('status', 'verified')
      .in('id', topIds);
    if (error) throw error;

    // .in() doesn't preserve the id order given to it — re-sort by the
    // actual view count so "most visited" isn't silently scrambled.
    return (data ?? [])
      .map((row: any) => ({ ...mapPublicListingRow(row), viewCount: viewCounts.get(row.id) ?? 0 }))
      .sort((a, b) => b.viewCount - a.viewCount);
  }

  // Replaces the old owner-only findOwnListings(ownerId), which locked
  // agents out of "my listings" entirely and, even for owners, had no
  // filters and returned every row unbounded. Role-aware: owners scope by
  // owner_id, agents by agent_id, super_admin bypasses scoping entirely
  // [Spec §5] — same discipline as LeadsRepository.list.
  async findMine(scope: MyListingsScope, filters: MyListingsFilters = {}): Promise<PaginatedListings> {
    const { page, pageSize, from, to } = resolvePagination(filters);

    // Category is now a managed table (property_type_categories), joined two
    // levels deep from listings (listings -> property_types ->
    // property_type_categories) — PostgREST's embedded-filter dot-path
    // reliably supports one level, not two, so this resolves via a
    // pre-lookup (category slug -> category id -> matching property_type
    // ids) rather than a nested `.eq('property_types.property_type_categories.slug', ...)`,
    // same pattern already used for hasVideo/agencySlug in findPublic.
    let categoryPropertyTypeIds: string[] | undefined;
    if (filters.propertyTypeCategory) {
      const { data: category, error: categoryError } = await this.supabase.client
        .from('property_type_categories')
        .select('id')
        .eq('slug', filters.propertyTypeCategory)
        .maybeSingle();
      if (categoryError) throw categoryError;
      if (!category) return { items: [], total: 0, page, pageSize };

      const { data: typeRows, error: typeError } = await this.supabase.client
        .from('property_types')
        .select('id')
        .eq('category_id', category.id);
      if (typeError) throw typeError;
      categoryPropertyTypeIds = (typeRows ?? []).map((r: any) => r.id);
      if (categoryPropertyTypeIds.length === 0) return { items: [], total: 0, page, pageSize };
    }

    let query = this.supabase.client.from('listings').select(PUBLIC_LISTING_COLUMNS, { count: 'exact' });

    if (scope.role === 'owner') {
      query = query.eq('owner_id', scope.userId);
    } else if (scope.role === 'agent') {
      // Agency-wide scope only kicks in when both the caller is actually
      // an agency admin AND the request explicitly asked for it — same
      // "silently ignored otherwise" discipline as LeadsRepository.list.
      const agencyStaffIds = filters.scope === 'agency' ? await this.getSameAgencyAgentIds(scope.agentId) : null;
      if (agencyStaffIds) {
        query = query.in('agent_id', agencyStaffIds);
      } else {
        query = query.eq('agent_id', scope.agentId);
      }
    } else if (scope.role === 'verification_staff') {
      // verification_staff has no ownership concept here (they're not the
      // agent/owner) — same "no ownership filter, staff can view any
      // listing" bypass assertCanAccessDocuments already grants for the
      // documents endpoints. Scoped hard to a single-id lookup rather than
      // super_admin's full unscoped bypass below: with no listingId this
      // would otherwise return every listing on the platform, which staff
      // has no legitimate reason to browse via "my listings" — the
      // unconditional `filters.listingId` eq-filter further down (mirrors
      // findById's same pattern at line ~215) is what actually narrows
      // this to the one listing the verification queue linked them to.
      if (!filters.listingId) return { items: [], total: 0, page, pageSize };
    }
    // super_admin: no scoping filter — bypasses per [Spec §5]/[Dev Instr §2.1].

    // Backed by the stored listings.poster_type column — one indexed
    // equality check, replacing the old source filter's agent_profiles
    // pre-lookup + hand-rolled OR-NOT-IN join.
    if (filters.posterType) query = query.eq('poster_type', filters.posterType);

    if (filters.status) query = query.eq('status', filters.status);
    if (categoryPropertyTypeIds) query = query.in('property_type_id', categoryPropertyTypeIds);
    if (filters.propertyTypeSlug) query = query.eq('property_types.slug', filters.propertyTypeSlug);
    if (filters.purpose) query = query.eq('purpose', filters.purpose);
    if (filters.listingId) query = query.eq('id', filters.listingId);
    if (filters.listingNumber) query = query.eq('listing_number', filters.listingNumber);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.area) query = query.ilike('area', `%${filters.area}%`);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    // See the matching comment in findPublic above — areaUnit alone (no
    // range) shouldn't narrow results.
    if (filters.areaUnit && (filters.minAreaValue || filters.maxAreaValue)) query = query.eq('area_unit', filters.areaUnit);
    if (filters.minAreaValue) query = query.gte('area_value', filters.minAreaValue);
    if (filters.maxAreaValue) query = query.lte('area_value', filters.maxAreaValue);
    if (filters.listedDateFrom) query = query.gte('created_at', filters.listedDateFrom);
    if (filters.listedDateTo) query = query.lte('created_at', filters.listedDateTo);

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data ?? []).map(mapPublicListingRow),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  // Backs the status tab badges ("Active (0)", "Pending (0)", etc.) seen on
  // the real Profolio "My Listings" page — computed at query time, never stored.
  async getStatusCounts(scope: MyListingsScope, filters: { scope?: 'own' | 'agency' } = {}): Promise<Record<string, number>> {
    let query = this.supabase.client.from('listings').select('status');

    if (scope.role === 'owner') {
      query = query.eq('owner_id', scope.userId);
    } else if (scope.role === 'agent') {
      // Same agency-wide widening as findMine() above — kept in sync so the
      // status tab badges match whatever result set "My Listings" is
      // actually showing.
      const agencyStaffIds = filters.scope === 'agency' ? await this.getSameAgencyAgentIds(scope.agentId) : null;
      if (agencyStaffIds) {
        query = query.in('agent_id', agencyStaffIds);
      } else {
        query = query.eq('agent_id', scope.agentId);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const status = (row as any).status as string;
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  // Returns every agent_profiles.id sharing callerAgentId's agency, or null
  // if the caller isn't an agency admin (or has no agency) — mirrors
  // LeadsRepository.getSameAgencyAgentIds exactly (copied rather than
  // shared, to avoid a cross-module dependency for one small lookup; keep
  // both in sync if the agency-admin resolution rule ever changes).
  private async getSameAgencyAgentIds(callerAgentId?: string): Promise<string[] | null> {
    if (!callerAgentId) return null;
    const { data: caller, error: callerError } = await this.supabase.client
      .from('agent_profiles')
      .select('agency_id, is_agency_admin')
      .eq('id', callerAgentId)
      .single();
    if (callerError) throw callerError;
    if (!caller.is_agency_admin || !caller.agency_id) return null;

    const { data: staff, error: staffError } = await this.supabase.client
      .from('agent_profiles')
      .select('id')
      .eq('agency_id', caller.agency_id);
    if (staffError) throw staffError;
    return (staff ?? []).map((row: any) => row.id);
  }

  // Auth gate for the per-listing analytics endpoints below — caller must be
  // the listing's own agent, that listing's agency admin (via the same
  // agency-staff-id resolution as findMine's agency scope), or super_admin.
  // Public so ListingsController can call it before running the analytics
  // query itself, same "check ownership in the controller before touching
  // the repository's data method" split as assertOwnListing there.
  async assertCanAccessListingAnalytics(scope: MyListingsScope, listingId: string): Promise<void> {
    if (scope.role === 'super_admin') return;

    const { agentId: listingAgentId } = await this.getOwnership(listingId);
    if (scope.role === 'agent' && listingAgentId === scope.agentId) return;

    if (scope.role === 'agent') {
      const agencyStaffIds = await this.getSameAgencyAgentIds(scope.agentId);
      if (agencyStaffIds && listingAgentId && agencyStaffIds.includes(listingAgentId)) return;
    }

    throw new ForbiddenException('You do not have access to this listing analytics.');
  }

  // Per-listing Views/Clicks/Calls/WhatsApp/SMS/Emails + Leads — same
  // listing_engagement_events/leads sources as AgentsRepository.getAnalytics,
  // just scoped to one listing_id instead of an agent's whole inventory (no
  // listing_ids pre-lookup needed, so no early-return-on-empty case here).
  async getAnalytics(listingId: string, filters: { since?: Date } = {}) {
    const since = filters.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [{ data: eventRows, error: eventsError }, { count: leadsCount, error: leadsError }] = await Promise.all([
      this.supabase.client
        .from('listing_engagement_events')
        .select('type')
        .eq('listing_id', listingId)
        .gte('created_at', since.toISOString()),
      this.supabase.client
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', listingId)
        .gte('created_at', since.toISOString()),
    ]);
    if (eventsError) throw eventsError;
    if (leadsError) throw leadsError;

    const counts = { views: 0, clicks: 0, calls: 0, whatsapp: 0, sms: 0, emails: 0 };
    for (const row of eventRows ?? []) {
      const type = (row as any).type as 'view' | 'click' | 'call' | 'whatsapp' | 'sms' | 'email';
      if (type === 'view') counts.views++;
      else if (type === 'click') counts.clicks++;
      else if (type === 'call') counts.calls++;
      else if (type === 'whatsapp') counts.whatsapp++;
      else if (type === 'sms') counts.sms++;
      else if (type === 'email') counts.emails++;
    }

    return { ...counts, leads: leadsCount ?? 0 };
  }

  // Same real listing_engagement_events ("view" rows) + leads rows as
  // getAnalytics above, grouped by calendar day instead of summed into one
  // total — mirrors AgentsRepository.getDailyAnalytics exactly, just scoped
  // to a single listing. Days with no activity still appear with 0s.
  async getDailyAnalytics(listingId: string, days = 7): Promise<{ date: string; views: number; leads: number }[]> {
    const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    since.setHours(0, 0, 0, 0);

    const byDate = new Map<string, { views: number; leads: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      byDate.set(d.toISOString().slice(0, 10), { views: 0, leads: 0 });
    }

    const [{ data: eventRows, error: eventsError }, { data: leadRows, error: leadsError }] = await Promise.all([
      this.supabase.client
        .from('listing_engagement_events')
        .select('type, created_at')
        .eq('listing_id', listingId)
        .eq('type', 'view')
        .gte('created_at', since.toISOString()),
      this.supabase.client
        .from('leads')
        .select('created_at')
        .eq('listing_id', listingId)
        .gte('created_at', since.toISOString()),
    ]);
    if (eventsError) throw eventsError;
    if (leadsError) throw leadsError;

    for (const row of eventRows ?? []) {
      const date = (row as any).created_at.slice(0, 10);
      const bucket = byDate.get(date);
      if (bucket) bucket.views++;
    }
    for (const row of leadRows ?? []) {
      const date = (row as any).created_at.slice(0, 10);
      const bucket = byDate.get(date);
      if (bucket) bucket.leads++;
    }

    return Array.from(byDate, ([date, counts]) => ({ date, ...counts }));
  }

  // Backs VerificationRepository.listQueue() — same PUBLIC_LISTING_COLUMNS
  // + mapPublicListingRow pattern as findPublic() above (media/agent/
  // amenities/contact numbers all joined and mapped to camelCase), just
  // filtered to 'pending_verification' instead of 'verified'. Previously
  // this method existed but was never called (VerificationRepository had
  // its own bare `select('*')` with no joins/mapping instead), so the
  // verification queue page only ever had a listing's title to show.
  async findPendingForVerification(filters: PaginationParams = {}) {
    const pagination = resolvePagination(filters);
    const { data, error, count } = await this.supabase.client
      .from('listings')
      .select(PUBLIC_LISTING_COLUMNS, { count: 'exact' })
      .eq('status', 'pending_verification')
      .order('created_at', { ascending: true })
      .range(pagination.from, pagination.to);
    if (error) throw error;
    return {
      items: (data ?? []).map(mapPublicListingRow),
      total: count ?? 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  // Super Admin direct lifecycle control — expired/deleted/downgraded/inactive
  // have no other write path anywhere in the codebase (My Listings pass
  // explicitly deferred this), and this also lets Super Admin override
  // verified/rejected outside the verification queue. Deliberately a plain
  // status update, not routed through record_verification_action() — that
  // RPC's verification_action enum only covers approve/reject/request_info
  // and writes to verification_audit_log, which is specifically for the
  // staff verification workflow, not general admin lifecycle changes.
  // Draft → pending_verification is the actual point a listing starts
  // consuming plan quota (see create()'s draft exemption above), so the
  // quota gate that create() skips for drafts belongs here instead. Owner
  // drafts have no agentId and are ungated, same as owner create().
  async submitDraft(listingId: string, agentId?: string) {
    if (agentId) {
      const allowed = await this.entitlements.canCreateListing(agentId);
      if (!allowed) {
        throw new ForbiddenException('Listing quota reached for your current plan — upgrade or free up a slot.');
      }
    }
    return this.setStatus(listingId, 'pending_verification');
  }

  async setStatus(listingId: string, status: string) {
    const { data, error } = await this.supabase.client
      .from('listings')
      .update({ status })
      .eq('id', listingId)
      .select('*, property_types (slug, label, property_type_categories (slug, label))')
      .single();
    if (error) throw error;
    return mapPublicListingRow(data);
  }

  // Spends one agent_credits row of the given type (hot/super_hot) to set
  // boost_tier — the write path listing_boost_tier never had before this
  // pass (it was permanently stuck at 'basic'). boost_expires_at drives
  // PlanLifecycleService's cron reverting it back once the window passes,
  // same "credits per period, not forever" model the tier's
  // hot_credits_per_period/super_hot_credits_per_period allotment implies.
  async boost(listingId: string, agentId: string, input: BoostListingDto) {
    // Server is the real gate, same principle as quota enforcement — the
    // client (property-management/MyPropertiesScreen) already hides this
    // action for non-verified listings, but that's UI-only and was
    // previously the only check (a mobile UI bug briefly let it through);
    // boosting a listing that isn't live yet shouldn't be possible
    // regardless of what the client does or doesn't render.
    const { data: listing, error: listingError } = await this.supabase.client
      .from('listings')
      .select('status')
      .eq('id', listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (listing?.status !== 'verified') {
      throw new BadRequestException('Only verified listings can be boosted.');
    }

    const { data: credit, error: creditError } = await this.supabase.client
      .from('agent_credits')
      .select('total, used')
      .eq('agent_id', agentId)
      .eq('credit_type', input.boostTier)
      .maybeSingle();
    if (creditError) throw creditError;

    const available = (credit?.total ?? 0) - (credit?.used ?? 0);
    if (available <= 0) {
      throw new BadRequestException(`No ${input.boostTier === 'hot' ? 'Hot' : 'Super Hot'} credits available — check your plan's allotment.`);
    }

    // Compare-and-swap on the exact `used` value just read, not a plain
    // read-then-write — without the .eq('used', ...) guard, two concurrent
    // boost requests (double-tap, retry-on-timeout) could both read the
    // same stale `used`, both pass the availability check above, and both
    // write used+1, recording only one spent credit for two actual boosts.
    // If another request won the race, .select() here returns no row —
    // fail loudly with a clear "try again" rather than silently proceeding
    // as if the spend succeeded.
    const { data: spent, error: spendError } = await this.supabase.client
      .from('agent_credits')
      .update({ used: (credit?.used ?? 0) + 1 })
      .eq('agent_id', agentId)
      .eq('credit_type', input.boostTier)
      .eq('used', credit?.used ?? 0)
      .select('used');
    if (spendError) throw spendError;
    if (!spent || spent.length === 0) {
      throw new BadRequestException('That credit was just spent by another request — please try again.');
    }

    const boostExpiresAt = new Date(Date.now() + BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.supabase.client
      .from('listings')
      .update({ boost_tier: input.boostTier, boost_expires_at: boostExpiresAt })
      .eq('id', listingId)
      .select('*, property_types (slug, label, property_type_categories (slug, label))')
      .single();
    if (error) throw error;
    return mapPublicListingRow(data);
  }

  // Spends one 'refresh' agent_credits row to bump refreshed_at to now() —
  // the write path for a credit type that's existed in the schema since
  // 0001_init.sql but never had one before this. Unlike boost(), this
  // doesn't touch boost_tier/set an expiry: a refresh is a one-time bump
  // within whatever boost tier the listing already has (applySort's
  // secondary order('refreshed_at', ...) is what makes it matter), matching
  // Zameen's Refresh credit ("resets a listing's timestamp"), not a timed
  // featured state like Hot/Super Hot.
  async refresh(listingId: string, agentId: string) {
    const { data: listing, error: listingError } = await this.supabase.client
      .from('listings')
      .select('status')
      .eq('id', listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (listing?.status !== 'verified') {
      throw new BadRequestException('Only verified listings can be refreshed.');
    }

    const { data: credit, error: creditError } = await this.supabase.client
      .from('agent_credits')
      .select('total, used')
      .eq('agent_id', agentId)
      .eq('credit_type', 'refresh')
      .maybeSingle();
    if (creditError) throw creditError;

    const available = (credit?.total ?? 0) - (credit?.used ?? 0);
    if (available <= 0) {
      throw new BadRequestException("No Refresh credits available — check your plan's allotment.");
    }

    // Same compare-and-swap guard as boost() — a stale-read race between two
    // concurrent refresh requests must not spend two credits for one
    // recorded refresh, or one credit for two.
    const { data: spent, error: spendError } = await this.supabase.client
      .from('agent_credits')
      .update({ used: (credit?.used ?? 0) + 1 })
      .eq('agent_id', agentId)
      .eq('credit_type', 'refresh')
      .eq('used', credit?.used ?? 0)
      .select('used');
    if (spendError) throw spendError;
    if (!spent || spent.length === 0) {
      throw new BadRequestException('That credit was just spent by another request — please try again.');
    }

    const { data, error } = await this.supabase.client
      .from('listings')
      .update({ refreshed_at: new Date().toISOString() })
      .eq('id', listingId)
      .select('*, property_types (slug, label, property_type_categories (slug, label))')
      .single();
    if (error) throw error;
    return mapPublicListingRow(data);
  }

  // Spends one 'story' agent_credits row to feature this listing for
  // STORY_DURATION_HOURS — a plain on/off flag (story_expires_at), not a
  // tier like boost_tier, since a Story placement is a separate 24-hour
  // spot rather than a rank against other listings. Same CAS-spend pattern
  // as boost()/refresh().
  async postStory(listingId: string, agentId: string) {
    const { data: listing, error: listingError } = await this.supabase.client
      .from('listings')
      .select('status')
      .eq('id', listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (listing?.status !== 'verified') {
      throw new BadRequestException('Only verified listings can be posted as a story.');
    }

    const { data: credit, error: creditError } = await this.supabase.client
      .from('agent_credits')
      .select('total, used')
      .eq('agent_id', agentId)
      .eq('credit_type', 'story')
      .maybeSingle();
    if (creditError) throw creditError;

    const available = (credit?.total ?? 0) - (credit?.used ?? 0);
    if (available <= 0) {
      throw new BadRequestException("No Story credits available — check your plan's allotment.");
    }

    const { data: spent, error: spendError } = await this.supabase.client
      .from('agent_credits')
      .update({ used: (credit?.used ?? 0) + 1 })
      .eq('agent_id', agentId)
      .eq('credit_type', 'story')
      .eq('used', credit?.used ?? 0)
      .select('used');
    if (spendError) throw spendError;
    if (!spent || spent.length === 0) {
      throw new BadRequestException('That credit was just spent by another request — please try again.');
    }

    const storyExpiresAt = new Date(Date.now() + STORY_DURATION_HOURS * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.supabase.client
      .from('listings')
      .update({ story_expires_at: storyExpiresAt })
      .eq('id', listingId)
      .select('*, property_types (slug, label, property_type_categories (slug, label))')
      .single();
    if (error) throw error;
    return mapPublicListingRow(data);
  }

  // Resets an expired listing back to 'verified' with a fresh expiry window
  // — the alternative to losing all its photos/details/history just because
  // the plan's listing_duration_days lapsed (PlanLifecycleService's cron).
  // Reuses EntitlementsService.getEntitlements() for the duration, the same
  // Lite-fallback-if-no-active-subscription convention
  // record_verification_action() (0042_listing_expiration.sql) uses for the
  // initial approval — kept consistent rather than duplicating that
  // fallback logic in SQL and here differently.
  async renew(listingId: string, agentId: string) {
    const { data: existing, error: existingError } = await this.supabase.client
      .from('listings')
      .select('status')
      .eq('id', listingId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.status !== 'expired') {
      throw new BadRequestException('Only expired listings can be renewed.');
    }

    const { listingDurationDays } = await this.entitlements.getEntitlements(agentId);
    const expiresAt =
      listingDurationDays != null ? new Date(Date.now() + listingDurationDays * 24 * 60 * 60 * 1000).toISOString() : null;

    const { data, error } = await this.supabase.client
      .from('listings')
      .update({ status: 'verified', expires_at: expiresAt })
      .eq('id', listingId)
      .select('*, property_types (slug, label, property_type_categories (slug, label))')
      .single();
    if (error) throw error;
    return mapPublicListingRow(data);
  }

  // Lightweight ownership lookup for the document-upload ownership check in
  // ListingsController — no GET /listings/:id detail endpoint exists yet to
  // reuse, so this stays a minimal, purpose-built query.
  async getOwnership(listingId: string): Promise<{ ownerId: string; agentId: string | null }> {
    const { data, error } = await this.supabase.client
      .from('listings')
      .select('owner_id, agent_id')
      .eq('id', listingId)
      .single();
    if (error) throw error;
    return { ownerId: data.owner_id, agentId: data.agent_id };
  }

  // Real property-verification requirement — ID card front/back, ownership
  // proof, last utility bill. Only PNG/JPEG/PDF are accepted, enforced
  // server-side in DocumentsService.upload(), not just by file extension.
  async addDocument(listingId: string, documentType: ListingDocumentType, file: Express.Multer.File) {
    const path = await this.documents.upload(`listings/${listingId}`, file);

    // "Replace" superseding an existing document of this type: find prior
    // rows for the same (listing_id, document_type) before inserting, so we
    // can drop them afterward — mirrors agencies.repository.ts::addDocument.
    const { data: staleRows, error: staleError } = await this.supabase.client
      .from('listing_documents')
      .select('id, file_path')
      .eq('listing_id', listingId)
      .eq('document_type', documentType);
    if (staleError) throw staleError;

    const { data, error } = await this.supabase.client
      .from('listing_documents')
      .insert({ listing_id: listingId, document_type: documentType, file_path: path })
      .select('id, document_type, file_path, uploaded_at')
      .single();
    if (error) throw error;

    if (staleRows?.length) {
      const { error: deleteError } = await this.supabase.client
        .from('listing_documents')
        .delete()
        .in('id', staleRows.map((row) => row.id));
      if (deleteError) throw deleteError;

      // Storage cleanup is best-effort — the DB rows above are the source
      // of truth for what's "the" document, so a failed object removal here
      // just leaves an orphaned file rather than corrupting any state.
      await Promise.all(staleRows.map((row) => this.documents.remove(row.file_path).catch(() => undefined)));
    }

    return {
      id: data.id,
      documentType: data.document_type,
      url: await this.documents.getSignedUrl(data.file_path),
      uploadedAt: data.uploaded_at,
    };
  }

  async listDocuments(listingId: string) {
    const { data, error } = await this.supabase.client
      .from('listing_documents')
      .select('id, document_type, file_path, uploaded_at')
      .eq('listing_id', listingId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;

    return Promise.all(
      (data ?? []).map(async (row: any) => ({
        id: row.id,
        documentType: row.document_type,
        url: await this.documents.getSignedUrl(row.file_path),
        uploadedAt: row.uploaded_at,
      })),
    );
  }

  // Real business requirement (Document Verification spec): "The agents do
  // not need to upload property ownership documents (their own
  // responsibility, continuously monitored by Jayedaad)." — but that trust
  // only extends to an AGENCY-affiliated agent (the agency's own onboarding
  // verification covers its staff, see agents.repository.ts:439's identical
  // agency_id distinction). An independent agent (no agency_id) isn't
  // vetted by anyone else, so they're treated like an owner here — only an
  // agency-affiliated agent's listings are exempt.
  async getDocumentCompleteness(listingId: string) {
    const { data: listing, error: listingError } = await this.supabase.client
      .from('listings')
      .select('poster_type')
      .eq('id', listingId)
      .single();
    if (listingError) throw listingError;

    // poster_type='agency' listings are covered by the agency's own
    // documents instead (see the poster_type migration) — was previously
    // derived via an agent_id -> agent_profiles.agency_id join; now backed
    // directly by the stored column.
    if (listing.poster_type === 'agency') {
      return { required: [] as ListingDocumentType[], uploaded: [] as ListingDocumentType[], missing: [] as ListingDocumentType[] };
    }

    const { data, error } = await this.supabase.client
      .from('listing_documents')
      .select('document_type')
      .eq('listing_id', listingId);
    if (error) throw error;

    const uploaded = Array.from(new Set((data ?? []).map((row: any) => row.document_type as ListingDocumentType)));
    const missing = REQUIRED_LISTING_DOCUMENT_TYPES.filter((type) => !uploaded.includes(type));

    return { required: REQUIRED_LISTING_DOCUMENT_TYPES, uploaded, missing };
  }

  // Hard gate — approving a listing is rejected if any required document
  // type hasn't been uploaded. Called from VerificationRepository.recordAction()
  // before the record_verification_action() RPC.
  async assertDocumentsComplete(listingId: string) {
    const { missing } = await this.getDocumentCompleteness(listingId);
    if (missing.length > 0) {
      throw new BadRequestException(`Cannot verify listing — missing required documents: ${missing.join(', ')}`);
    }
  }
}

// Supabase returns raw Postgres column names (snake_case) and nested
// relations as their table name — this maps a findPublic() row onto the
// camelCase `Listing` shape apps/web and apps/mobile actually consume
// (packages/core/src/models/index.ts).
function mapPublicListingRow(row: any) {
  return {
    id: row.id,
    listingNumber: row.listing_number,
    title: row.title,
    description: row.description,
    price: row.price,
    purpose: row.purpose,
    city: row.city,
    area: row.area,
    society: row.society,
    subArea: row.sub_area,
    latitude: row.latitude,
    longitude: row.longitude,
    propertyType: row.property_types && {
      slug: row.property_types.slug,
      label: row.property_types.label,
      category: row.property_types.property_type_categories,
    },
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    kitchens: row.kitchens,
    floors: row.floors,
    areaValue: row.area_value,
    areaUnit: row.area_unit,
    yearBuilt: row.year_built,
    floorLevel: row.floor_level,
    furnishingStatus: row.furnishing_status,
    boostTier: row.boost_tier,
    boostExpiresAt: row.boost_expires_at,
    refreshedAt: row.refreshed_at,
    storyExpiresAt: row.story_expires_at,
    expiresAt: row.expires_at,
    installmentAvailable: row.installment_available,
    readyForPossession: row.ready_for_possession,
    advanceAmount: row.advance_amount,
    numberOfInstallments: row.number_of_installments,
    monthlyInstallment: row.monthly_installment,
    balloonPaymentAvailable: row.balloon_payment_available,
    balloonPaymentAmount: row.balloon_payment_amount,
    ballotingFeeApplicable: row.balloting_fee_applicable,
    ballotingFeeAmount: row.balloting_fee_amount,
    possessionFeeApplicable: row.possession_fee_applicable,
    possessionFeeAmount: row.possession_fee_amount,
    developmentFeeApplicable: row.development_fee_applicable,
    developmentFeeAmount: row.development_fee_amount,
    status: row.status,
    posterType: row.poster_type,
    createdAt: row.created_at,
    media: (row.listing_media ?? []).map((m: any) => ({
      url: m.url,
      type: m.type,
      compressedUrl: m.compressed_url,
      isCover: m.is_cover,
      sortOrder: m.sort_order,
      category: m.category ?? null,
    })),
    // value/textValue: confirmed real on a scraped Zameen detail page —
    // some amenities carry a number, free text, or a chosen dropdown option,
    // not just presence (e.g. "Parking Spaces: 2", "View: Mountain View",
    // "Flooring: Tiles"). valueType/valueUnit/options come from the
    // catalog, value/textValue from this listing's row.
    amenities: (row.listing_amenities ?? []).map((la: any) => ({
      slug: la.amenities.slug,
      label: la.amenities.label,
      category: la.amenities.category,
      valueType: la.amenities.value_type,
      valueUnit: la.amenities.value_unit,
      options: la.amenities.options,
      value: la.value,
      textValue: la.text_value,
    })),
    contactNumbers: (row.listing_contact_numbers ?? []).map((c: any) => ({
      type: c.type,
      countryCode: c.country_code,
      number: c.number,
    })),
    // Confirmed real on a scraped Zameen detail page's sidebar agency card
    // (agency name/logo, agent name, "TITANIUM"-style tier badge). Nullable
    // — an owner-only submission has no assigned agent. The tier badge comes
    // from the agent's own active subscription, not the agency (agencies
    // don't hold a tier in this schema — subscriptions.agent_id does).
    agent: row.agent_profiles && {
      id: row.agent_profiles.id,
      displayName: row.agent_profiles.display_name,
      photoUrl: row.agent_profiles.photo_url,
      agency: row.agent_profiles.agencies && {
        name: row.agent_profiles.agencies.name,
        slug: row.agent_profiles.agencies.slug,
        logoUrl: row.agent_profiles.agencies.logo_url,
      },
      subscriptionTierName: row.agent_profiles.subscriptions?.subscription_tiers?.name ?? null,
    },
  };
}
