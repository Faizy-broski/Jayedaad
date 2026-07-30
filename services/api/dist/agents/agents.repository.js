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
exports.AgentsRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const documents_service_1 = require("../documents/documents.service");
const agencies_repository_1 = require("../agencies/agencies.repository");
const PROFILE_COLUMNS = 'id, display_name, title, bio, phone, whatsapp, landline, city, address, photo_url, verification_status, agencies (id, name, slug, logo_url)';
let AgentsRepository = class AgentsRepository {
    supabase;
    documents;
    constructor(supabase, documents) {
        this.supabase = supabase;
        this.documents = documents;
    }
    // Supabase's implicit-join select returns raw snake_case (display_name,
    // photo_url, agencies) — packages/core's AgentProfileSummary expects
    // camelCase (displayName, photoUrl, agency). This was missing entirely:
    // phone/whatsapp/landline/city/address/bio happen to be spelled the same
    // in both cases so they "worked", but displayName/photoUrl/agency were
    // always undefined on the client — the exact cause of "Name doesn't save"
    // (the form's useEffect kept resetting to '' since profile.displayName
    // never actually held the saved value).
    mapProfileRow(row) {
        return {
            id: row.id,
            displayName: row.display_name,
            title: row.title,
            bio: row.bio,
            phone: row.phone,
            whatsapp: row.whatsapp,
            landline: row.landline,
            city: row.city,
            address: row.address,
            photoUrl: row.photo_url,
            verificationStatus: row.verification_status,
            agency: row.agencies ?? null,
        };
    }
    async findProfile(agentId) {
        const { data, error } = await this.supabase.client
            .from('agent_profiles')
            .select(PROFILE_COLUMNS)
            .eq('id', agentId)
            .single();
        if (error)
            throw error;
        return this.mapProfileRow(data);
    }
    // The Profolio "User Settings" page's actual save action. Ownership is
    // enforced at the controller (see agents.controller.ts::assertOwnAgentOrAdmin),
    // not here — this method trusts its caller, same as every other repository
    // in this codebase.
    async updateProfile(agentId, input) {
        const { data, error } = await this.supabase.client
            .from('agent_profiles')
            .update({
            display_name: input.displayName,
            phone: input.phone,
            whatsapp: input.whatsapp,
            landline: input.landline,
            city: input.city,
            address: input.address,
            bio: input.bio,
            photo_url: input.photoUrl,
        })
            .eq('id', agentId)
            .select(PROFILE_COLUMNS)
            .single();
        if (error)
            throw error;
        return this.mapProfileRow(data);
    }
    // The write side of "Upload a picture" — separate from updateProfile()
    // since it's driven by a file upload, not the rest of the form fields.
    async updatePhoto(agentId, photoUrl) {
        const { data, error } = await this.supabase.client
            .from('agent_profiles')
            .update({ photo_url: photoUrl })
            .eq('id', agentId)
            .select(PROFILE_COLUMNS)
            .single();
        if (error)
            throw error;
        return this.mapProfileRow(data);
    }
    // Property inventory broken down by purpose + type, scoped to one agent —
    // mirrors AgenciesRepository.getStats() exactly, just without the
    // agency-membership resolution step. Real Zameen agency pages show this
    // exact stat shape (counts + breakdown, no listing grid); nothing
    // previously gave an individual agent's own profile the same treatment —
    // a real gap, especially for independent agents with no agency page at all.
    async getStats(agentId) {
        const { data: listingRows, error: listingError } = await this.supabase.client
            .from('listings')
            .select('purpose, boost_tier, property_types (label)')
            .eq('status', 'verified')
            .eq('agent_id', agentId);
        if (listingError)
            throw listingError;
        let forSaleCount = 0;
        let forRentCount = 0;
        const byType = new Map();
        // Confirmed real on the Profolio dashboard's Listings card (Active/For
        // Sale/For Rent/Super Hot/Hot counts) — boost tier is shown right
        // alongside purpose, not just property type.
        const byBoostTier = new Map();
        for (const row of listingRows ?? []) {
            const label = row.property_types?.label ?? 'Other';
            const entry = byType.get(label) ?? { forSale: 0, forRent: 0 };
            if (row.purpose === 'sale') {
                forSaleCount++;
                entry.forSale++;
            }
            else {
                forRentCount++;
                entry.forRent++;
            }
            byType.set(label, entry);
            const tier = row.boost_tier;
            byBoostTier.set(tier, (byBoostTier.get(tier) ?? 0) + 1);
        }
        return {
            forSaleCount,
            forRentCount,
            byPropertyType: Array.from(byType.entries()).map(([label, counts]) => ({ label, ...counts })),
            byBoostTier: Array.from(byBoostTier.entries()).map(([tier, count]) => ({ tier, count })),
        };
    }
    // Confirmed real on the Profolio Analytics card: Views/Clicks/Calls/
    // WhatsApp/SMS/Emails from listing_engagement_events, plus Leads from the
    // `leads` table, filterable by purpose (all/sale/rent) and a date range —
    // matches the real UI's "All / For Sale / For Rent" + "Last 30 Days" filters.
    async getAnalytics(agentId, filters = {}) {
        const since = filters.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let listingsQuery = this.supabase.client.from('listings').select('id').eq('agent_id', agentId);
        if (filters.purpose)
            listingsQuery = listingsQuery.eq('purpose', filters.purpose);
        const { data: listingRows, error: listingsError } = await listingsQuery;
        if (listingsError)
            throw listingsError;
        const listingIds = (listingRows ?? []).map((r) => r.id);
        if (listingIds.length === 0) {
            return { views: 0, clicks: 0, leads: 0, calls: 0, whatsapp: 0, sms: 0, emails: 0 };
        }
        const [{ data: eventRows, error: eventsError }, { count: leadsCount, error: leadsError }] = await Promise.all([
            this.supabase.client
                .from('listing_engagement_events')
                .select('type')
                .in('listing_id', listingIds)
                .gte('created_at', since.toISOString()),
            this.supabase.client
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .in('listing_id', listingIds)
                .gte('created_at', since.toISOString()),
        ]);
        if (eventsError)
            throw eventsError;
        if (leadsError)
            throw leadsError;
        const counts = { views: 0, clicks: 0, calls: 0, whatsapp: 0, sms: 0, emails: 0 };
        for (const row of eventRows ?? []) {
            const type = row.type;
            if (type === 'view')
                counts.views++;
            else if (type === 'click')
                counts.clicks++;
            else if (type === 'call')
                counts.calls++;
            else if (type === 'whatsapp')
                counts.whatsapp++;
            else if (type === 'sms')
                counts.sms++;
            else if (type === 'email')
                counts.emails++;
        }
        return { ...counts, leads: leadsCount ?? 0 };
    }
    // Confirmed real on the Profolio "Quota and Credits" card: separate
    // Available/Used/Total pools per credit type, not a single quota number.
    async getCredits(agentId) {
        const { data, error } = await this.supabase.client
            .from('agent_credits')
            .select('credit_type, total, used')
            .eq('agent_id', agentId);
        if (error)
            throw error;
        return (data ?? []).map((row) => ({
            creditType: row.credit_type,
            total: row.total,
            used: row.used,
            available: row.total - row.used,
        }));
    }
    // Super Admin grant/adjust — the write-side counterpart to getCredits()
    // above, explicitly deferred pending this module in the Analytics pass.
    // Upserts on (agent_id, credit_type) [0001_init.sql unique constraint];
    // only the fields actually provided are touched, so a partial adjustment
    // (e.g. just bumping `total`) doesn't clobber `used`.
    async grantCredits(agentId, input) {
        const existing = await this.supabase.client
            .from('agent_credits')
            .select('total, used')
            .eq('agent_id', agentId)
            .eq('credit_type', input.creditType)
            .maybeSingle();
        if (existing.error)
            throw existing.error;
        const { data, error } = await this.supabase.client
            .from('agent_credits')
            .upsert({
            agent_id: agentId,
            credit_type: input.creditType,
            total: input.total ?? existing.data?.total ?? 0,
            used: input.used ?? existing.data?.used ?? 0,
        }, { onConflict: 'agent_id,credit_type' })
            .select('credit_type, total, used')
            .single();
        if (error)
            throw error;
        return { creditType: data.credit_type, total: data.total, used: data.used, available: data.total - data.used };
    }
    async listReviews(agentId) {
        const { data, error } = await this.supabase.client
            .from('agent_reviews')
            .select('id, agent_id, reviewer_id, rating, body, created_at')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    // Unique (agent_id, reviewer_id) constraint in the DB [0006 migration]
    // prevents review spam — one review per reviewer per agent.
    async createReview(reviewerId, agentId, input) {
        const { data, error } = await this.supabase.client
            .from('agent_reviews')
            .insert({ agent_id: agentId, reviewer_id: reviewerId, rating: input.rating, body: input.body })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Real onboarding requirement — same document set as agencies (company
    // registration, owner's ID card, tax certificate): an independent agent
    // (no agency_id) stands in as their own "company" for onboarding purposes.
    async addDocument(agentId, documentType, file) {
        const path = await this.documents.upload(`agents/${agentId}`, file);
        const { data, error } = await this.supabase.client
            .from('onboarding_documents')
            .insert({ agent_id: agentId, document_type: documentType, file_path: path })
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
    async listDocuments(agentId) {
        const { data, error } = await this.supabase.client
            .from('onboarding_documents')
            .select('id, document_type, file_path, uploaded_at')
            .eq('agent_id', agentId)
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
    async getDocumentCompleteness(agentId) {
        const { data, error } = await this.supabase.client
            .from('onboarding_documents')
            .select('document_type')
            .eq('agent_id', agentId);
        if (error)
            throw error;
        const uploaded = Array.from(new Set((data ?? []).map((row) => row.document_type)));
        const missing = agencies_repository_1.REQUIRED_ONBOARDING_DOCUMENT_TYPES.filter((type) => !uploaded.includes(type));
        return { required: agencies_repository_1.REQUIRED_ONBOARDING_DOCUMENT_TYPES, uploaded, missing };
    }
    // The write path that never existed until now — agent_profiles.verification_status
    // has had no endpoint to set it since the column was introduced. Symmetric
    // with AgenciesRepository.setVerificationStatus() (also super_admin-only).
    // Only independent agents (no agency_id) are gated on document
    // completeness — an agency-affiliated agent is covered by the agency's
    // own documents/verification.
    async setVerificationStatus(agentId, status) {
        if (status === 'verified') {
            const { data: agent, error: agentError } = await this.supabase.client
                .from('agent_profiles')
                .select('agency_id')
                .eq('id', agentId)
                .single();
            if (agentError)
                throw agentError;
            if (!agent.agency_id) {
                const { missing } = await this.getDocumentCompleteness(agentId);
                if (missing.length > 0) {
                    throw new common_1.BadRequestException(`Cannot verify agent — missing required documents: ${missing.join(', ')}`);
                }
            }
        }
        const { data, error } = await this.supabase.client
            .from('agent_profiles')
            .update({ verification_status: status })
            .eq('id', agentId)
            .select(PROFILE_COLUMNS)
            .single();
        if (error)
            throw error;
        return this.mapProfileRow(data);
    }
};
exports.AgentsRepository = AgentsRepository;
exports.AgentsRepository = AgentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        documents_service_1.DocumentsService])
], AgentsRepository);
