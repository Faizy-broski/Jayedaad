import { useQuery } from '@tanstack/react-query';
import { agentsRepository, AgentAnalyticsFilters } from '../services/agentsRepository';
import { listingsRepository } from '../services/listingsRepository';
import { useAuthViewModel } from './useAuthViewModel';

// Drives the Profolio-style agent Dashboard — stats/credits/analytics
// cards plus the Recent Listings section, all scoped to the signed-in
// agent's own agentId (from the JWT via useAuthViewModel, same pattern
// leads/listings screens already use for role-aware data).
export function useAgentDashboardViewModel(analyticsFilters: AgentAnalyticsFilters = {}) {
  const { agentId } = useAuthViewModel();

  const statsQuery = useQuery({
    queryKey: ['agents', agentId, 'stats'],
    queryFn: () => agentsRepository.getStats(agentId!),
    enabled: !!agentId,
  });

  const creditsQuery = useQuery({
    queryKey: ['agents', agentId, 'credits'],
    queryFn: () => agentsRepository.getCredits(agentId!),
    enabled: !!agentId,
  });

  const analyticsQuery = useQuery({
    queryKey: ['agents', agentId, 'analytics', analyticsFilters],
    queryFn: () => agentsRepository.getAnalytics(agentId!, analyticsFilters),
    enabled: !!agentId,
  });

  const dailyAnalyticsQuery = useQuery({
    queryKey: ['agents', agentId, 'analytics', 'daily'],
    queryFn: () => agentsRepository.getDailyAnalytics(agentId!),
    enabled: !!agentId,
  });

  const recentListingsQuery = useQuery({
    queryKey: ['listings', 'mine', 'recent'],
    queryFn: () => listingsRepository.findMine({ page: 1, pageSize: 5 }),
    enabled: !!agentId,
  });

  return {
    stats: statsQuery.data,
    isStatsLoading: statsQuery.isLoading,
    credits: creditsQuery.data ?? [],
    isCreditsLoading: creditsQuery.isLoading,
    analytics: analyticsQuery.data,
    isAnalyticsLoading: analyticsQuery.isLoading,
    dailyAnalytics: dailyAnalyticsQuery.data ?? [],
    isDailyAnalyticsLoading: dailyAnalyticsQuery.isLoading,
    recentListings: recentListingsQuery.data?.items ?? [],
    isRecentListingsLoading: recentListingsQuery.isLoading,
  };
}
