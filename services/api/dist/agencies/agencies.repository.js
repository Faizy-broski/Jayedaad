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
exports.AgenciesRepository = exports.REQUIRED_ONBOARDING_DOCUMENT_TYPES = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const documents_service_1 = require("../documents/documents.service");
const AGENCY_COLUMNS = 'id, name, slug, logo_url, description, phone, email, city, address, business_hours, verification_status';
// Real business requirement: these 3 documents are required to onboard a
// company/agency — same literal list used for independent agents
// (agents.repository.ts), since an agency-affiliated agent is covered by
// their agency's own documents.
exports.REQUIRED_ONBOARDING_DOCUMENT_TYPES = [
    'company_registration',
    'owner_id_card',
    'tax_certificate',
];
// Zameen.com distinguishes an Agency (company) from an individual Agent, who
// may belong to one or work independently — agent_profiles.agency_id is
// nullable. Aggregate stats (listing counts, views) are deliberately NOT
// stored here — computed at query time, matching the single-source-of-truth
// principle already established for view counts [Reqs §4.3].
let AgenciesRepository = class AgenciesRepository {
    supabase;
    documents;
    constructor(supabase, documents) {
        this.supabase = supabase;
        this.documents = documents;
    }
    async list(filters = {}) {
        let query = this.supabase.client
            .from('agencies')
            .select(AGENCY_COLUMNS)
            .eq('verification_status', 'verified')
            .order('name', { ascending: true });
        if (filters.city)
            query = query.eq('city', filters.city);
        const { data, error } = await query;
        if (error)
            throw error;
        return data;
    }
    async findBySlug(slug) {
        const { data, error } = await this.supabase.client
            .from('agencies')
            .select(`${AGENCY_COLUMNS}, agent_profiles (id, display_name, title, photo_url)`)
            .eq('slug', slug)
            .single();
        if (error)
            throw error;
        return data;
    }
    // Property inventory broken down by purpose + type — confirmed on a real
    // Zameen agency page ("12 Houses... for sale / 8 Buildings... for rent").
    // Not a stored figure: computed here from `listings` every call.
    async getStats(agencyId) {
        const { data: agentRows, error: agentError } = await this.supabase.client
            .from('agent_profiles')
            .select('id')
            .eq('agency_id', agencyId);
        if (agentError)
            throw agentError;
        const agentIds = (agentRows ?? []).map((r) => r.id);
        if (agentIds.length === 0) {
            return { forSaleCount: 0, forRentCount: 0, byPropertyType: [], byBoostTier: [] };
        }
        const { data: listingRows, error: listingError } = await this.supabase.client
            .from('listings')
            .select('purpose, boost_tier, property_types (label)')
            .eq('status', 'verified')
            .in('agent_id', agentIds);
        if (listingError)
            throw listingError;
        let forSaleCount = 0;
        let forRentCount = 0;
        const byType = new Map();
        // Confirmed real on the Profolio dashboard's Listings card — boost tier
        // breakdown shown alongside purpose, mirrors AgentsRepository.getStats().
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
    async create(input) {
        const { data, error } = await this.supabase.client
            .from('agencies')
            .insert({
            name: input.name,
            slug: input.slug,
            description: input.description,
            phone: input.phone,
            email: input.email,
            city: input.city,
            address: input.address,
            business_hours: input.businessHours,
            logo_url: input.logoUrl,
            verification_status: 'pending',
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Super Admin verification decision — the write-mechanism `create()` above
    // deliberately left unbuilt (every agency starts and stays 'pending' until
    // now). Mirrors the verification/rejection pattern already established for
    // listings (verification_audit_log's status transitions).
    async setVerificationStatus(id, status) {
        // Hard gate — real business requirement: an agency can't be verified
        // without company registration, owner's ID card, and a tax certificate
        // already uploaded.
        if (status === 'verified') {
            await this.assertDocumentsComplete(id);
        }
        const { data, error } = await this.supabase.client
            .from('agencies')
            .update({ verification_status: status })
            .eq('id', id)
            .select(AGENCY_COLUMNS)
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, input) {
        const { data, error } = await this.supabase.client
            .from('agencies')
            .update({
            name: input.name,
            description: input.description,
            phone: input.phone,
            email: input.email,
            city: input.city,
            address: input.address,
            business_hours: input.businessHours,
            logo_url: input.logoUrl,
        })
            .eq('id', id)
            .select(AGENCY_COLUMNS)
            .single();
        if (error)
            throw error;
        return data;
    }
    async remove(id) {
        const { error } = await this.supabase.client.from('agencies').delete().eq('id', id);
        if (error)
            throw error;
        return { id };
    }
    // Real onboarding requirement — company registration, owner's ID card,
    // tax certificate. Only PNG/JPEG/PDF are accepted, enforced server-side in
    // DocumentsService.upload(), not just by file extension.
    async addDocument(agencyId, documentType, file) {
        const path = await this.documents.upload(`agencies/${agencyId}`, file);
        const { data, error } = await this.supabase.client
            .from('onboarding_documents')
            .insert({ agency_id: agencyId, document_type: documentType, file_path: path })
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
    async listDocuments(agencyId) {
        const { data, error } = await this.supabase.client
            .from('onboarding_documents')
            .select('id, document_type, file_path, uploaded_at')
            .eq('agency_id', agencyId)
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
    async getDocumentCompleteness(agencyId) {
        const { data, error } = await this.supabase.client
            .from('onboarding_documents')
            .select('document_type')
            .eq('agency_id', agencyId);
        if (error)
            throw error;
        const uploaded = Array.from(new Set((data ?? []).map((row) => row.document_type)));
        const missing = exports.REQUIRED_ONBOARDING_DOCUMENT_TYPES.filter((type) => !uploaded.includes(type));
        return { required: exports.REQUIRED_ONBOARDING_DOCUMENT_TYPES, uploaded, missing };
    }
    async assertDocumentsComplete(agencyId) {
        const { missing } = await this.getDocumentCompleteness(agencyId);
        if (missing.length > 0) {
            throw new common_1.BadRequestException(`Cannot verify agency — missing required documents: ${missing.join(', ')}`);
        }
    }
};
exports.AgenciesRepository = AgenciesRepository;
exports.AgenciesRepository = AgenciesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        documents_service_1.DocumentsService])
], AgenciesRepository);
