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
exports.VerificationRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const listings_repository_1 = require("../listings/listings.repository");
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
let VerificationRepository = class VerificationRepository {
    supabase;
    listings;
    constructor(supabase, listings) {
        this.supabase = supabase;
        this.listings = listings;
    }
    async listQueue() {
        const { data, error } = await this.supabase.client
            .from('listings')
            .select('*')
            .eq('status', 'pending_verification')
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        return data;
    }
    // Status update + audit log insert happen atomically inside the Postgres
    // function (supabase/migrations/0003_rpc_functions.sql), so an audit entry
    // can never be silently dropped — satisfies [Dev Instr §2.2].
    async recordAction(reviewerId, listingId, action, note) {
        // Hard gate — real business requirement: a listing can't be verified
        // without its required documents (ID card front/back, ownership proof,
        // last utility bill) already uploaded.
        if (action === 'approve') {
            await this.listings.assertDocumentsComplete(listingId);
        }
        const { error } = await this.supabase.client.rpc('record_verification_action', {
            p_listing_id: listingId,
            p_reviewer_id: reviewerId,
            p_action: action,
            p_note: note ?? null,
        });
        if (error)
            throw error;
    }
    // Read-back for verification_audit_log — every write already atomically
    // logged (record_verification_action() above), but nothing until now let
    // Super Admin ever query it. Super Admin-only, not verification_staff: per
    // [Dev Instr §2.2] staff act and log, but broad audit visibility across all
    // reviewers is an oversight capability, not a daily-use one.
    async listAuditLog(filters = {}) {
        const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
        const pageSize = Math.min(filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        let query = this.supabase.client
            .from('verification_audit_log')
            .select('id, listing_id, reviewer_id, action, note, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);
        if (filters.listingId)
            query = query.eq('listing_id', filters.listingId);
        if (filters.reviewerId)
            query = query.eq('reviewer_id', filters.reviewerId);
        if (filters.dateFrom)
            query = query.gte('created_at', filters.dateFrom);
        if (filters.dateTo)
            query = query.lte('created_at', filters.dateTo);
        const { data, error, count } = await query;
        if (error)
            throw error;
        return { items: data ?? [], total: count ?? 0, page, pageSize };
    }
};
exports.VerificationRepository = VerificationRepository;
exports.VerificationRepository = VerificationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        listings_repository_1.ListingsRepository])
], VerificationRepository);
