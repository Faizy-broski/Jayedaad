import { httpClient } from './httpClient';
import { Listing, PaginatedAuditLog, VerificationAuditLogEntry } from '../models';

export type VerificationAction = 'approve' | 'reject' | 'request-info';

export interface AuditLogFilters {
  listingId?: string;
  reviewerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// services/api/src/verification/verification.repository.ts::listAuditLog
// returns raw snake_case rows — mapped here to VerificationAuditLogEntry.
function mapAuditLogRow(row: any): VerificationAuditLogEntry {
  return {
    id: row.id,
    listingId: row.listing_id,
    reviewerId: row.reviewer_id,
    action: row.action,
    note: row.note,
    createdAt: row.created_at,
  };
}

export const verificationRepository = {
  queue: async (): Promise<Listing[]> => {
    const { data } = await httpClient.get('/verification/queue');
    return data;
  },

  act: async ({ listingId, action, note }: { listingId: string; action: VerificationAction; note?: string }) => {
    const { data } = await httpClient.post(`/verification/${listingId}/${action}`, { note });
    return data;
  },

  // Super Admin-only.
  auditLog: async (filters: AuditLogFilters = {}): Promise<PaginatedAuditLog> => {
    const { data } = await httpClient.get('/verification/audit-log', { params: filters });
    return { ...data, items: (data.items as any[]).map(mapAuditLogRow) };
  },
};
