import { useQuery } from '@tanstack/react-query';
import { listingsRepository } from '../services/listingsRepository';

// Drives the per-listing performance breakdown (Views/Clicks/Leads/Calls/
// WhatsApp/SMS/Emails plus the daily trend chart) — the listing-scoped
// counterpart to useAgentDashboardViewModel's analytics half.
export function useListingAnalyticsViewModel(listingId: string | undefined) {
  const analyticsQuery = useQuery({
    queryKey: ['listings', listingId, 'analytics'],
    queryFn: () => listingsRepository.getAnalytics(listingId!),
    enabled: !!listingId,
  });

  const dailyAnalyticsQuery = useQuery({
    queryKey: ['listings', listingId, 'analytics', 'daily'],
    queryFn: () => listingsRepository.getDailyAnalytics(listingId!),
    enabled: !!listingId,
  });

  return {
    analytics: analyticsQuery.data,
    isAnalyticsLoading: analyticsQuery.isLoading,
    dailyAnalytics: dailyAnalyticsQuery.data ?? [],
    isDailyAnalyticsLoading: dailyAnalyticsQuery.isLoading,
  };
}
