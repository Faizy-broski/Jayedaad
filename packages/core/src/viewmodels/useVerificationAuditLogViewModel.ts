import { useQuery } from '@tanstack/react-query';
import { AuditLogFilters, verificationRepository } from '../services/verificationRepository';

// Super Admin verification audit log — read-only history of every
// approve/reject/request_info decision. `enabled` (default true) lets a
// caller that only sometimes has a legitimate reason to query this (e.g.
// admin/listings/[id]/page.tsx's "Verified by" lookup, which should only
// ever fire for a super_admin viewer of an already-verified listing) skip
// the request entirely rather than let it round-trip into an expected 403
// — GET /verification/audit-log stays super_admin-only server-side.
export function useVerificationAuditLogViewModel(filters: AuditLogFilters = {}, options: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: ['admin', 'verification-audit-log', filters],
    queryFn: () => verificationRepository.auditLog(filters),
    enabled: options.enabled ?? true,
  });

  return {
    entries: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
