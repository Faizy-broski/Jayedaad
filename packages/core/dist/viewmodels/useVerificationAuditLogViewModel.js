import { useQuery } from '@tanstack/react-query';
import { verificationRepository } from '../services/verificationRepository';
// Super Admin verification audit log — read-only history of every
// approve/reject/request_info decision.
export function useVerificationAuditLogViewModel(filters = {}) {
    const query = useQuery({
        queryKey: ['admin', 'verification-audit-log', filters],
        queryFn: () => verificationRepository.auditLog(filters),
    });
    return {
        entries: query.data?.items ?? [],
        total: query.data?.total ?? 0,
        page: query.data?.page ?? filters.page ?? 1,
        pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
        isLoading: query.isLoading,
    };
}
