import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { TrackEngagementDto } from './dto/track-engagement.dto';
import { Role } from '../common/types';
import { DocumentsService } from '../documents/documents.service';
import { getRequiredMediaCategories } from './listing-media-categories';

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
  sortBy?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedListings {
  items: ReturnType<typeof mapPublicListingRow>[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

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
      // enum's declaration order), then recency — mirrors Zameen's real
      // ranking: paid "Value Booster" placements rank above organic listings.
      return query.order('boost_tier', { ascending: false }).order('created_at', { ascending: false });
  }
}

// PostgREST's .or() filter string is itself a small DSL — strip characters
// that are syntactically significant in it (or in ILIKE patterns) rather
// than interpolate a raw user string into the filter.
function sanitizeKeyword(keyword: string): string {
  return keyword.replace(/[,()%]/g, ' ').trim();
}

const PUBLIC_LISTING_COLUMNS = `
  id, listing_number, title, description, price, purpose, city, area, society, sub_area,
  latitude, longitude, bedrooms, bathrooms, kitchens, floors, area_value,
  area_unit, year_built, floor_level, furnishing_status, boost_tier,
  installment_available, ready_for_possession,
  advance_amount, number_of_installments, monthly_installment,
  balloon_payment_available, balloon_payment_amount,
  balloting_fee_applicable, balloting_fee_amount,
  possession_fee_applicable, possession_fee_amount,
  development_fee_applicable, development_fee_amount,
  status, created_at,
  property_types!inner (slug, label, property_type_categories (slug, label)),
  listing_media (url, type, compressed_url, is_cover, sort_order, category),
  listing_amenities (value, text_value, amenities (slug, label, category, value_type, value_unit, options)),
  listing_contact_numbers (type, country_code, number),
  agent_profiles (
    id, display_name, photo_url,
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
  ) {}

  // requesterId (if the caller is authenticated) is attached to the
  // search_queries log row — [Reqs §4.2] "most-searched user queries", a
  // table that has existed since the first migration with nothing writing to it.
  async findPublic(filters: ListingSearchFilters = {}, requesterId?: string): Promise<PaginatedListings> {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
    const pageSize = Math.min(
      filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

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
    if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms);
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
    if (filters.keyword) {
      const term = sanitizeKeyword(filters.keyword);
      if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }
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
  async create(input: CreateListingDto & { ownerId: string; agentId?: string; status?: 'draft' | 'pending_verification' }) {
    // Hard gate — real business requirement (Document Verification Phase
    // 4): categorized photos are mandatory before a listing can be
    // submitted. Applies to every listing regardless of owner/agent (photo
    // quality isn't an ownership-verification concern, unlike
    // getDocumentCompleteness above); drafts are exempt since they're
    // explicitly in-progress.
    if (input.status !== 'draft') {
      const required = getRequiredMediaCategories(input.bedrooms, input.bathrooms);
      const uploadedCounts = new Map<string, number>();
      for (const m of input.media ?? []) {
        if (!m.category) continue;
        uploadedCounts.set(m.category, (uploadedCounts.get(m.category) ?? 0) + 1);
      }
      const missing = required.filter((c) => c.required && (uploadedCounts.get(c.slug) ?? 0) < c.minCount);
      if (missing.length > 0) {
        throw new BadRequestException(
          `Cannot submit listing — missing required photos: ${missing.map((c) => c.label).join(', ')}`,
        );
      }
    }

    const { data: listing, error } = await this.supabase.client
      .from('listings')
      .insert({
        owner_id: input.ownerId,
        agent_id: input.agentId,
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
  // this trusts its caller. Business rule: editing a listing that was
  // already reviewed (verified/rejected) resets it to pending_verification
  // — content changes need re-review, same as any real moderation platform.
  // A listing still pending stays pending. amenities/media/contactNumbers
  // are replace-in-full when provided (delete-then-reinsert), same approach
  // create() uses for the initial insert.
  async update(listingId: string, input: UpdateListingDto) {
    const { data: existing, error: existingError } = await this.supabase.client
      .from('listings')
      .select('status, property_type_id')
      .eq('id', listingId)
      .single();
    if (existingError) throw existingError;

    const nextStatus =
      existing.status === 'verified' || existing.status === 'rejected' ? 'pending_verification' : existing.status;

    const updatePayload: Record<string, unknown> = { status: nextStatus };
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
    const { data, error } = await this.supabase.client
      .from('listings')
      .select(PUBLIC_LISTING_COLUMNS)
      .eq('id', listingId)
      .eq('status', 'verified')
      .single();
    if (error) throw error;
    return mapPublicListingRow(data);
  }

  // "Similar properties" section seen on real Zameen detail pages — computed
  // at query time (same city + property type, excluding the listing itself),
  // not a stored relation.
  async findSimilar(listingId: string, limit = 6) {
    const { data: current, error: currentError } = await this.supabase.client
      .from('listings')
      .select('city, property_type_id')
      .eq('id', listingId)
      .single();
    if (currentError) throw currentError;

    const { data, error } = await this.supabase.client
      .from('listings')
      .select(PUBLIC_LISTING_COLUMNS)
      .eq('status', 'verified')
      .eq('city', current.city)
      .eq('property_type_id', current.property_type_id)
      .neq('id', listingId)
      .order('boost_tier', { ascending: false })
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
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
    const pageSize = Math.min(
      filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

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
      query = query.eq('agent_id', scope.agentId);
    }
    // super_admin: no scoping filter — bypasses per [Spec §5]/[Dev Instr §2.1].

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
  async getStatusCounts(scope: MyListingsScope): Promise<Record<string, number>> {
    let query = this.supabase.client.from('listings').select('status');

    if (scope.role === 'owner') {
      query = query.eq('owner_id', scope.userId);
    } else if (scope.role === 'agent') {
      query = query.eq('agent_id', scope.agentId);
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

  async findPendingForVerification() {
    const { data, error } = await this.supabase.client
      .from('listings')
      .select('*, property_types (slug, label, property_type_categories (slug, label))')
      .eq('status', 'pending_verification')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  // Super Admin direct lifecycle control — expired/deleted/downgraded/inactive
  // have no other write path anywhere in the codebase (My Listings pass
  // explicitly deferred this), and this also lets Super Admin override
  // verified/rejected outside the verification queue. Deliberately a plain
  // status update, not routed through record_verification_action() — that
  // RPC's verification_action enum only covers approve/reject/request_info
  // and writes to verification_audit_log, which is specifically for the
  // staff verification workflow, not general admin lifecycle changes.
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

    const { data, error } = await this.supabase.client
      .from('listing_documents')
      .insert({ listing_id: listingId, document_type: documentType, file_path: path })
      .select('id, document_type, file_path, uploaded_at')
      .single();
    if (error) throw error;

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
  // responsibility, continuously monitored by Jayedaad)." — only an
  // individual owner posting without an agent is required to upload
  // ownership_proof/utility_bill, mirroring the exact "independent vs.
  // covered-elsewhere" distinction agents.repository.ts:439 already makes
  // for agent_profiles.agency_id.
  async getDocumentCompleteness(listingId: string) {
    const { data: listing, error: listingError } = await this.supabase.client
      .from('listings')
      .select('agent_id')
      .eq('id', listingId)
      .single();
    if (listingError) throw listingError;

    if (listing.agent_id) {
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
