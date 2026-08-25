import { useQuery } from '@tanstack/react-query';
import { agentsRepository, AgentRevenueFilters } from '../services/agentsRepository';

// Drives the Revenue page — commission revenue bucketed by month/quarter/
// year, plus the per-agent breakdown when scope: 'agency' is requested.
// Naming mirrors useListingAnalyticsViewModel's analytics/isAnalyticsLoading
// convention.
export function useRevenueViewModel(agentId: string | undefined, filters: AgentRevenueFilters) {
  const revenueQuery = useQuery({
    queryKey: ['agents', agentId, 'revenue', filters],
    queryFn: () => agentsRepository.getRevenue(agentId!, filters),
    enabled: !!agentId,
  });

  return {
    revenue: revenueQuery.data,
    isRevenueLoading: revenueQuery.isLoading,
    isRevenueError: revenueQuery.isError,
    refetchRevenue: revenueQuery.refetch,
  };
}
