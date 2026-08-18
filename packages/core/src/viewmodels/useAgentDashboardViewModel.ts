import { useQuery } from '@tanstack/react-query';
import { agentsRepository, AgentAnalyticsFilters } from '../services/agentsRepository';
import { listingsRepository } from '../services/listingsRepository';
import { useAgentCreditsViewModel } from './useAgentCreditsViewModel';
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

  // Shared with MyPropertiesScreen (mobile) and the property-management
  // page (web), which also spend these credits — one cache entry per
  // agent, not a duplicate fetch, since it uses the same query key.
  const { credits, isLoading: isCreditsLoading } = useAgentCreditsViewModel();

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

  // status: 'verified' — this backs the dashboard's "My Listings"/"N
  // active" widget, so it must only ever show live listings. Without a
  // status filter, findMine returns every status including 'deleted'
  // (soft-delete, not a real row removal) and 'draft'/'rejected'/'expired',
  // so a long-deleted listing kept showing here and 404'd on open.
  const recentListingsQuery = useQuery({
    queryKey: ['listings', 'mine', 'recent'],
    queryFn: () => listingsRepository.findMine({ page: 1, pageSize: 5, status: 'verified' }),
    enabled: !!agentId,
  });

  return {
    stats: statsQuery.data,
    isStatsLoading: statsQuery.isLoading,
    credits,
    isCreditsLoading,
    analytics: analyticsQuery.data,
    isAnalyticsLoading: analyticsQuery.isLoading,
    dailyAnalytics: dailyAnalyticsQuery.data ?? [],
    isDailyAnalyticsLoading: dailyAnalyticsQuery.isLoading,
    recentListings: recentListingsQuery.data?.items ?? [],
    isRecentListingsLoading: recentListingsQuery.isLoading,
    isRecentListingsError: recentListingsQuery.isError,
  };
}
