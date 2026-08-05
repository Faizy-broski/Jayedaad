import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ListingsRepository } from '../listings/listings.repository';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface AuditLogFilters {
  listingId?: string;
  reviewerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class VerificationRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly listings: ListingsRepository,
  ) {}

  async listQueue() {
    const { data, error } = await this.supabase.client
      .from('listings')
      .select('*')
      .eq('status', 'pending_verification')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
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
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
    const pageSize = Math.min(
      filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client
      .from('verification_audit_log')
      .select('id, listing_id, reviewer_id, action, note, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.listingId) query = query.eq('listing_id', filters.listingId);
    if (filters.reviewerId) query = query.eq('reviewer_id', filters.reviewerId);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    const { data, error, count } = await query;
    if (error) throw error;

    return { items: data ?? [], total: count ?? 0, page, pageSize };
  }
}
