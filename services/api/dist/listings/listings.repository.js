"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsRepository = exports.REQUIRED_LISTING_DOCUMENT_TYPES = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const documents_service_1 = require("../documents/documents.service");
// Real business requirement: these 4 documents are required for property
// verification. "Required" = the full literal list — no separate
// optional-vs-required catalog.
exports.REQUIRED_LISTING_DOCUMENT_TYPES = [
    'id_card_front',
    'id_card_back',
    'ownership_proof',
    'utility_bill',
];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
function applySort(query, sortBy) {
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
function sanitizeKeyword(keyword) {
    return keyword.replace(/[,()%]/g, ' ').trim();
}
const PUBLIC_LISTING_COLUMNS = `
  id, title, description, price, purpose, city, area, society, sub_area,
  latitude, longitude, bedrooms, bathrooms, kitchens, floors, area_value,
  area_unit, year_built, floor_level, furnishing_status, boost_tier,
  installment_available, ready_for_possession, status, created_at,
  property_types!inner (slug, label, property_type_categories (slug, label)),
  listing_media (url, compressed_url, is_cover, sort_order),
  listing_amenities (value, amenities (slug, label, category, value_unit)),
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
let ListingsRepository = class ListingsRepository {
    supabase;
    documents;
    constructor(supabase, documents) {
        this.supabase = supabase;
        this.documents = documents;
    }
    // requesterId (if the caller is authenticated) is attached to the
    // search_queries log row — [Reqs §4.2] "most-searched user queries", a
    // table that has existed since the first migration with nothing writing to it.
    async findPublic(filters = {}, requesterId) {
        const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
        const pageSize = Math.min(filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        // Existence-filter pre-lookups. Done as separate queries (not an
        // embedded !inner filter) so they don't distort the `media`/agent
        // columns actually returned by the main select.
        let videoListingIds;
        if (filters.hasVideo) {
            const { data, error } = await this.supabase.client.from('listing_media').select('listing_id').eq('type', 'video');
            if (error)
                throw error;
            videoListingIds = Array.from(new Set((data ?? []).map((r) => r.listing_id)));
            if (videoListingIds.length === 0) {
                this.logSearchQuery(filters, requesterId);
                return { items: [], total: 0, page, pageSize };
            }
        }
        let agencyAgentIds;
        if (filters.agencySlug) {
            const { data: agency, error: agencyError } = await this.supabase.client
                .from('agencies')
                .select('id')
                .eq('slug', filters.agencySlug)
                .maybeSingle();
            if (agencyError)
                throw agencyError;
            if (!agency) {
                this.logSearchQuery(filters, requesterId);
                return { items: [], total: 0, page, pageSize };
            }
            const { data: agentRows, error: agentError } = await this.supabase.client
                .from('agent_profiles')
                .select('id')
                .eq('agency_id', agency.id);
            if (agentError)
                throw agentError;
            agencyAgentIds = (agentRows ?? []).map((r) => r.id);
            if (agencyAgentIds.length === 0) {
                this.logSearchQuery(filters, requesterId);
                return { items: [], total: 0, page, pageSize };
            }
        }
        let query = this.supabase.client
            .from('listings')
            .select(PUBLIC_LISTING_COLUMNS, { count: 'exact' })
            .eq('status', 'verified');
        if (filters.city)
            query = query.eq('city', filters.city);
        if (filters.area)
            query = query.eq('area', filters.area);
        if (filters.propertyTypeSlug)
            query = query.eq('property_types.slug', filters.propertyTypeSlug);
        if (filters.purpose)
            query = query.eq('purpose', filters.purpose);
        if (filters.bedrooms)
            query = query.eq('bedrooms', filters.bedrooms);
        if (filters.minBathrooms)
            query = query.gte('bathrooms', filters.minBathrooms);
        if (filters.areaUnit)
            query = query.eq('area_unit', filters.areaUnit);
        if (filters.minAreaValue)
            query = query.gte('area_value', filters.minAreaValue);
        if (filters.maxAreaValue)
            query = query.lte('area_value', filters.maxAreaValue);
        if (filters.minPrice)
            query = query.gte('price', filters.minPrice);
        if (filters.maxPrice)
            query = query.lte('price', filters.maxPrice);
        if (filters.furnishingStatus)
            query = query.eq('furnishing_status', filters.furnishingStatus);
        if (filters.keyword) {
            const term = sanitizeKeyword(filters.keyword);
            if (term)
                query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
        }
        if (videoListingIds)
            query = query.in('id', videoListingIds);
        if (agencyAgentIds)
            query = query.in('agent_id', agencyAgentIds);
        query = applySort(query, filters.sortBy).range(from, to);
        // Logging runs concurrently with the main query, not before it — an
        // analytics-log failure must never break or slow down an actual search.
        const [{ data, error, count }] = await Promise.all([query, this.logSearchQuery(filters, requesterId)]);
        if (error)
            throw error;
        return {
            items: (data ?? []).map(mapPublicListingRow),
            total: count ?? 0,
            page,
            pageSize,
        };
    }
    async logSearchQuery(filters, userId) {
        const { page: _page, pageSize: _pageSize, sortBy: _sortBy, keyword, ...structuredFilters } = filters;
        try {
            await this.supabase.client.from('search_queries').insert({
                query_text: keyword ?? '',
                user_id: userId ?? null,
                structured_filters: structuredFilters,
            });
        }
        catch {
            // Analytics logging is best-effort — never let it fail a search request.
        }
    }
    // Fixes the "table exists, nothing writes to it" gap found on
    // listing_engagement_events (formerly listing_views) — the same issue
    // search_queries had before the Search pass. Called by clients whenever a
    // view/click/call/whatsapp/sms/email interaction happens on a listing.
    async trackEngagement(listingId, input) {
        const { error } = await this.supabase.client.from('listing_engagement_events').insert({
            listing_id: listingId,
            type: input.type,
            platform: input.platform,
            viewer_session_id: input.viewerSessionId,
        });
        if (error)
            throw error;
    }
    // Powers the hierarchical City -> Area location picker seen on the real
    // Zameen search page — nothing populated this before. Deduped client-side;
    // fine at MVP scale, worth a dedicated distinct-values view/materialized
    // table once listing volume is real.
    async listCities() {
        const { data, error } = await this.supabase.client.from('listings').select('city').eq('status', 'verified');
        if (error)
            throw error;
        return Array.from(new Set((data ?? []).map((r) => r.city))).sort();
    }
    async listAreas(city) {
        const { data, error } = await this.supabase.client
            .from('listings')
            .select('area')
            .eq('status', 'verified')
            .eq('city', city);
        if (error)
            throw error;
        return Array.from(new Set((data ?? []).map((r) => r.area))).sort();
    }
    // status is always forced to pending_verification here — the DTO has no
    // status field, so there is no code path where a submission could arrive
    // pre-verified [Spec §7].
    async create(input) {
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
            status: 'pending_verification',
            // boost_tier omitted — defaults to 'basic' in the DB; it's a paid
            // promotion, never client-settable at submission time.
        })
            .select()
            .single();
        if (error)
            throw error;
        if (input.contactNumbers?.length) {
            const { error: contactError } = await this.supabase.client.from('listing_contact_numbers').insert(input.contactNumbers.map((contact) => ({
                listing_id: listing.id,
                type: contact.type,
                country_code: contact.countryCode ?? '+92',
                number: contact.number,
            })));
            if (contactError)
                throw contactError;
        }
        if (input.amenities?.length) {
            await this.addListingAmenities(listing.id, input.propertyTypeId, input.amenities);
        }
        return listing;
    }
    // Hard gate — only amenities linked to this listing's property-type
    // category (via amenity_property_type_categories) are accepted, e.g. a
    // Plot submission can't select Drawing Room. Confirmed a real gap: every
    // amenity used to be selectable for every property type regardless of
    // relevance.
    async addListingAmenities(listingId, propertyTypeId, amenities) {
        const { data: propertyType, error: propertyTypeError } = await this.supabase.client
            .from('property_types')
            .select('category_id')
            .eq('id', propertyTypeId)
            .single();
        if (propertyTypeError)
            throw propertyTypeError;
        const slugs = amenities.map((a) => a.slug);
        const { data: amenityRows, error: amenitiesError } = await this.supabase.client
            .from('amenities')
            .select('id, slug, amenity_property_type_categories (property_type_category_id)')
            .in('slug', slugs);
        if (amenitiesError)
            throw amenitiesError;
        const amenityBySlug = new Map((amenityRows ?? []).map((row) => [row.slug, row]));
        const invalidSlugs = slugs.filter((slug) => {
            const row = amenityBySlug.get(slug);
            if (!row)
                return true;
            const linkedCategoryIds = (row.amenity_property_type_categories ?? []).map((link) => link.property_type_category_id);
            return !linkedCategoryIds.includes(propertyType.category_id);
        });
        if (invalidSlugs.length > 0) {
            throw new common_1.BadRequestException(`These amenities don't apply to this property type: ${invalidSlugs.join(', ')}`);
        }
        const { error: linkError } = await this.supabase.client.from('listing_amenities').insert(amenities.map((a) => ({
            listing_id: listingId,
            amenity_id: amenityBySlug.get(a.slug).id,
            value: a.value,
        })));
        if (linkError)
            throw linkError;
    }
    // The property detail page itself — confirmed real via a scraped Zameen
    // listing detail page, and a genuine gap: nothing fetched a single
    // listing by id before this. Same "verified-only" restriction as
    // findPublic() [blueprint §4.2]: unverified listings must never be
    // reachable via the public API.
    async findById(listingId) {
        const { data, error } = await this.supabase.client
            .from('listings')
            .select(PUBLIC_LISTING_COLUMNS)
            .eq('id', listingId)
            .eq('status', 'verified')
            .single();
        if (error)
            throw error;
        return mapPublicListingRow(data);
    }
    // "Similar properties" section seen on real Zameen detail pages — computed
    // at query time (same city + property type, excluding the listing itself),
    // not a stored relation.
    async findSimilar(listingId, limit = 6) {
        const { data: current, error: currentError } = await this.supabase.client
            .from('listings')
            .select('city, property_type_id')
            .eq('id', listingId)
            .single();
        if (currentError)
            throw currentError;
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
        if (error)
            throw error;
        return (data ?? []).map(mapPublicListingRow);
    }
    // Replaces the old owner-only findOwnListings(ownerId), which locked
    // agents out of "my listings" entirely and, even for owners, had no
    // filters and returned every row unbounded. Role-aware: owners scope by
    // owner_id, agents by agent_id, super_admin bypasses scoping entirely
    // [Spec §5] — same discipline as LeadsRepository.list.
    async findMine(scope, filters = {}) {
        const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
        const pageSize = Math.min(filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        // Category is now a managed table (property_type_categories), joined two
        // levels deep from listings (listings -> property_types ->
        // property_type_categories) — PostgREST's embedded-filter dot-path
        // reliably supports one level, not two, so this resolves via a
        // pre-lookup (category slug -> category id -> matching property_type
        // ids) rather than a nested `.eq('property_types.property_type_categories.slug', ...)`,
        // same pattern already used for hasVideo/agencySlug in findPublic.
        let categoryPropertyTypeIds;
        if (filters.propertyTypeCategory) {
            const { data: category, error: categoryError } = await this.supabase.client
                .from('property_type_categories')
                .select('id')
                .eq('slug', filters.propertyTypeCategory)
                .maybeSingle();
            if (categoryError)
                throw categoryError;
            if (!category)
                return { items: [], total: 0, page, pageSize };
            const { data: typeRows, error: typeError } = await this.supabase.client
                .from('property_types')
                .select('id')
                .eq('category_id', category.id);
            if (typeError)
                throw typeError;
            categoryPropertyTypeIds = (typeRows ?? []).map((r) => r.id);
            if (categoryPropertyTypeIds.length === 0)
                return { items: [], total: 0, page, pageSize };
        }
        let query = this.supabase.client.from('listings').select(PUBLIC_LISTING_COLUMNS, { count: 'exact' });
        if (scope.role === 'owner') {
            query = query.eq('owner_id', scope.userId);
        }
        else if (scope.role === 'agent') {
            query = query.eq('agent_id', scope.agentId);
        }
        // super_admin: no scoping filter — bypasses per [Spec §5]/[Dev Instr §2.1].
        if (filters.status)
            query = query.eq('status', filters.status);
        if (categoryPropertyTypeIds)
            query = query.in('property_type_id', categoryPropertyTypeIds);
        if (filters.propertyTypeSlug)
            query = query.eq('property_types.slug', filters.propertyTypeSlug);
        if (filters.purpose)
            query = query.eq('purpose', filters.purpose);
        if (filters.listingId)
            query = query.eq('id', filters.listingId);
        if (filters.minPrice)
            query = query.gte('price', filters.minPrice);
        if (filters.maxPrice)
            query = query.lte('price', filters.maxPrice);
        if (filters.areaUnit)
            query = query.eq('area_unit', filters.areaUnit);
        if (filters.minAreaValue)
            query = query.gte('area_value', filters.minAreaValue);
        if (filters.maxAreaValue)
            query = query.lte('area_value', filters.maxAreaValue);
        if (filters.listedDateFrom)
            query = query.gte('created_at', filters.listedDateFrom);
        if (filters.listedDateTo)
            query = query.lte('created_at', filters.listedDateTo);
        query = query.order('created_at', { ascending: false }).range(from, to);
        const { data, error, count } = await query;
        if (error)
            throw error;
        return {
            items: (data ?? []).map(mapPublicListingRow),
            total: count ?? 0,
            page,
            pageSize,
        };
    }
    // Backs the status tab badges ("Active (0)", "Pending (0)", etc.) seen on
    // the real Profolio "My Listings" page — computed at query time, never stored.
    async getStatusCounts(scope) {
        let query = this.supabase.client.from('listings').select('status');
        if (scope.role === 'owner') {
            query = query.eq('owner_id', scope.userId);
        }
        else if (scope.role === 'agent') {
            query = query.eq('agent_id', scope.agentId);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        const counts = {};
        for (const row of data ?? []) {
            const status = row.status;
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
        if (error)
            throw error;
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
    async setStatus(listingId, status) {
        const { data, error } = await this.supabase.client
            .from('listings')
            .update({ status })
            .eq('id', listingId)
            .select('*, property_types (slug, label, property_type_categories (slug, label))')
            .single();
        if (error)
            throw error;
        return mapPublicListingRow(data);
    }
    // Lightweight ownership lookup for the document-upload ownership check in
    // ListingsController — no GET /listings/:id detail endpoint exists yet to
    // reuse, so this stays a minimal, purpose-built query.
    async getOwnership(listingId) {
        const { data, error } = await this.supabase.client
            .from('listings')
            .select('owner_id, agent_id')
            .eq('id', listingId)
            .single();
        if (error)
            throw error;
        return { ownerId: data.owner_id, agentId: data.agent_id };
    }
    // Real property-verification requirement — ID card front/back, ownership
    // proof, last utility bill. Only PNG/JPEG/PDF are accepted, enforced
    // server-side in DocumentsService.upload(), not just by file extension.
    async addDocument(listingId, documentType, file) {
        const path = await this.documents.upload(`listings/${listingId}`, file);
        const { data, error } = await this.supabase.client
            .from('listing_documents')
            .insert({ listing_id: listingId, document_type: documentType, file_path: path })
            .select('id, document_type, file_path, uploaded_at')
            .single();
        if (error)
            throw error;
        return {
            id: data.id,
            documentType: data.document_type,
            url: await this.documents.getSignedUrl(data.file_path),
            uploadedAt: data.uploaded_at,
        };
    }
    async listDocuments(listingId) {
        const { data, error } = await this.supabase.client
            .from('listing_documents')
            .select('id, document_type, file_path, uploaded_at')
            .eq('listing_id', listingId)
            .order('uploaded_at', { ascending: false });
        if (error)
            throw error;
        return Promise.all((data ?? []).map(async (row) => ({
            id: row.id,
            documentType: row.document_type,
            url: await this.documents.getSignedUrl(row.file_path),
            uploadedAt: row.uploaded_at,
        })));
    }
    async getDocumentCompleteness(listingId) {
        const { data, error } = await this.supabase.client
            .from('listing_documents')
            .select('document_type')
            .eq('listing_id', listingId);
        if (error)
            throw error;
        const uploaded = Array.from(new Set((data ?? []).map((row) => row.document_type)));
        const missing = exports.REQUIRED_LISTING_DOCUMENT_TYPES.filter((type) => !uploaded.includes(type));
        return { required: exports.REQUIRED_LISTING_DOCUMENT_TYPES, uploaded, missing };
    }
    // Hard gate — approving a listing is rejected if any required document
    // type hasn't been uploaded. Called from VerificationRepository.recordAction()
    // before the record_verification_action() RPC.
    async assertDocumentsComplete(listingId) {
        const { missing } = await this.getDocumentCompleteness(listingId);
        if (missing.length > 0) {
            throw new common_1.BadRequestException(`Cannot verify listing — missing required documents: ${missing.join(', ')}`);
        }
    }
};
exports.ListingsRepository = ListingsRepository;
exports.ListingsRepository = ListingsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        documents_service_1.DocumentsService])
], ListingsRepository);
// Supabase returns raw Postgres column names (snake_case) and nested
// relations as their table name — this maps a findPublic() row onto the
// camelCase `Listing` shape apps/web and apps/mobile actually consume
// (packages/core/src/models/index.ts).
function mapPublicListingRow(row) {
    return {
        id: row.id,
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
        status: row.status,
        createdAt: row.created_at,
        media: (row.listing_media ?? []).map((m) => ({
            url: m.url,
            compressedUrl: m.compressed_url,
            isCover: m.is_cover,
            sortOrder: m.sort_order,
        })),
        // value/valueUnit: confirmed real on a scraped Zameen detail page —
        // some amenities carry a number, not just presence (e.g. "Parking
        // Spaces: 2"). valueUnit comes from the catalog, value from this listing's row.
        amenities: (row.listing_amenities ?? []).map((la) => ({
            slug: la.amenities.slug,
            label: la.amenities.label,
            category: la.amenities.category,
            valueUnit: la.amenities.value_unit,
            value: la.value,
        })),
        contactNumbers: (row.listing_contact_numbers ?? []).map((c) => ({
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
