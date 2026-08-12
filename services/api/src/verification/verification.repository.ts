import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ListingsRepository } from '../listings/listings.repository';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { paginate, PaginationParams, resolvePagination } from '../common/pagination';

const ACTION_TITLE: Record<'approve' | 'reject' | 'request_info', string> = {
  approve: 'Your listing was verified',
  reject: 'Your listing was rejected',
  request_info: 'More information needed on your listing',
};

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
  private readonly logger = new Logger(VerificationRepository.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly listings: ListingsRepository,
    private readonly notifications: NotificationsRepository,
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

    await this.notifyOwner(listingId, action, note);
  }

  // 'verification_status' has existed as a NotificationType since
  // 0009_notifications.sql with no code path ever using it — a listing's
  // owner (listings.owner_id, the real submitter regardless of role, not
  // agent_id) had no way to learn their listing was approved/rejected
  // except by polling their own listing list. Best-effort, same discipline
  // as SupportRepository.notifySuperAdmins — a notification failure must
  // never fail the verification action itself, which has already
  // committed by the time this runs.
  private async notifyOwner(listingId: string, action: 'approve' | 'reject' | 'request_info', note?: string): Promise<void> {
    try {
      const { data: listing, error } = await this.supabase.client
        .from('listings')
        .select('owner_id, title')
        .eq('id', listingId)
        .maybeSingle();
      if (error || !listing) return;

      await this.notifications.create({
        userId: listing.owner_id,
        type: 'verification_status',
        title: ACTION_TITLE[action],
        body: note ?? listing.title,
        relatedListingId: listingId,
      });
    } catch (err) {
      this.logger.warn(`Failed to notify listing owner of verification action — listing ${listingId}`, err as Error);
    }
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
