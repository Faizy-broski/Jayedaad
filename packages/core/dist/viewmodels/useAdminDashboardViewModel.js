import { useQuery } from '@tanstack/react-query';
import { adminRepository } from '../services/adminRepository';
// Super Admin dashboard landing page — platform-wide KPI rollup plus the
// agents overview roster, both computed at query time server-side.
export function useAdminDashboardViewModel() {
    const statsQuery = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: adminRepository.getPlatformStats,
    });
    const agentsQuery = useQuery({
        queryKey: ['admin', 'agents-overview'],
        queryFn: adminRepository.listAgentsOverview,
    });
    return {
        stats: statsQuery.data,
        isStatsLoading: statsQuery.isLoading,
        agents: agentsQuery.data ?? [],
        isAgentsLoading: agentsQuery.isLoading,
    };
}
