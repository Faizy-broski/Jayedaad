import { useQuery } from '@tanstack/react-query';
import { adminRepository } from '../services/adminRepository';

// Super Admin dashboard landing page — platform-wide KPI rollup plus the
// agents overview roster, both computed at query time server-side.
export function useAdminDashboardViewModel() {
  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminRepository.getPlatformStats,
  });

  // Called with no filters -> the unpaginated array branch of the
  // dual-mode endpoint (see admin.repository.ts::listAgentsOverview).
  const agentsQuery = useQuery({
    queryKey: ['admin', 'agents-overview', {}],
    queryFn: () => adminRepository.listAgentsOverview(),
  });
  const agentsData = agentsQuery.data;
  const agents = Array.isArray(agentsData) ? agentsData : (agentsData?.items ?? []);

  return {
    stats: statsQuery.data,
    isStatsLoading: statsQuery.isLoading,
    isStatsError: statsQuery.isError,
    agents,
    isAgentsLoading: agentsQuery.isLoading,
  };
}
