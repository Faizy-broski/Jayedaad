import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ListingsRepository } from '../listings/listings.repository';
import { paginate, PaginationParams, resolvePagination } from '../common/pagination';

export interface AuditLogFilters extends PaginationParams {
  listingId?: string;
  reviewerId?: string;
  dateFrom?: string;
  dateTo?: string;
  // Applied server-side (.eq before .range()) — the admin Verification Log
  // page used to filter this client-side over only the currently-loaded
  // page, so an entry on page 2 was invisible while the "approve"/"reject"
  // tab was active on page 1.
  action?: 'approve' | 'reject' | 'request_info';
}

@Injectable()
export class VerificationRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly listings: ListingsRepository,
  ) {}

  // Delegates to ListingsRepository.findPendingForVerification() — the
  // real join+mapping logic lives there (same PUBLIC_LISTING_COLUMNS/
  // mapPublicListingRow the public search uses), so the queue page gets
  // full Listing objects (photos, agent, amenities, contact numbers)
  // instead of a bare, unmapped `select('*')` row.
  async listQueue(filters: PaginationParams = {}) {
    return this.listings.findPendingForVerification(filters);
  }

  // Status update + audit log insert happen atomically inside the Postgres
  // function (supabase/migrations/0003_rpc_functions.sql), so an audit entry
  // can never be silently dropped — satisfies [Dev Instr §2.2].
  async recordAction(
    reviewerId: string,
    listingId: string,
    action: 'approve' | 'reject' | 'request_info',
    note?: string,
  ) {
    // Hard gate — real business requirement: an individual owner's listing
    // can't be verified without ownership proof/utility bill uploaded.
    // Agent-posted listings are exempt (see getDocumentCompleteness).
    if (action === 'approve') {
      await this.listings.assertDocumentsComplete(listingId);
    }

    const { error } = await this.supabase.client.rpc('record_verification_action', {
      p_listing_id: listingId,
      p_reviewer_id: reviewerId,
      p_action: action,
      p_note: note ?? null,
    });
    if (error) throw error;
  }

  // Read-back for verification_audit_log — every write already atomically
  // logged (record_verification_action() above), but nothing until now let
  // Super Admin ever query it. Super Admin-only, not verification_staff: per
  // [Dev Instr §2.2] staff act and log, but broad audit visibility across all
  // reviewers is an oversight capability, not a daily-use one.
  async listAuditLog(filters: AuditLogFilters = {}) {
    const pagination = resolvePagination(filters);

    let query = this.supabase.client
      .from('verification_audit_log')
      .select('id, listing_id, reviewer_id, action, note, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.listingId) query = query.eq('listing_id', filters.listingId);
    if (filters.reviewerId) query = query.eq('reviewer_id', filters.reviewerId);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
    query = query.range(pagination.from, pagination.to);

    return paginate(query, pagination);
  }
}
