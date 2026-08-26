import { useQuery } from '@tanstack/react-query';
import { adminRepository } from '../services/adminRepository';

export type RevenuePeriod = 'month' | 'quarter' | 'year';

// One agency's aggregate commission revenue (GET /admin/agencies/:id/revenue)
// — Super Admin-only, no anchor agentId needed (see
// DealsRepository.getAgencyRevenue). Drives the CRM entity detail panel's
// agency branch.
export function useAgencyRevenueViewModel(agencyId: string | undefined, period: RevenuePeriod) {
  const query = useQuery({
    queryKey: ['admin', 'agencies', agencyId, 'revenue', period],
    queryFn: () => adminRepository.getAgencyRevenue(agencyId!, { period }),
    enabled: !!agencyId,
  });

  return {
    revenue: query.data,
    isRevenueLoading: query.isLoading,
    isRevenueError: query.isError,
  };
}
