import { useQuery } from '@tanstack/react-query';
import { agentsRepository } from '../services/agentsRepository';
import { useAuthViewModel } from './useAuthViewModel';

// Extracted out of useAgentDashboardViewModel (which still uses this
// internally, so there's exactly one query/cache entry per agent, not a
// duplicate fetch) so screens that spend credits — not just the Dashboard's
// credits card — can show a live balance next to the Boost/Refresh/Story
// buttons (MyPropertiesScreen.tsx on mobile, the property-management page
// on web). Query key is ['agents', 'credits', agentId] (agentId LAST, not
// nested between 'agents' and 'credits') specifically so
// useMyListingsViewModel's boost/refresh/postStory mutations can invalidate
// every agent's credits query with a plain ['agents', 'credits'] prefix
// match, without needing to know the current agentId themselves.
export function useAgentCreditsViewModel() {
  const { agentId } = useAuthViewModel();

  const creditsQuery = useQuery({
    queryKey: ['agents', 'credits', agentId],
    queryFn: () => agentsRepository.getCredits(agentId!),
    enabled: !!agentId,
  });

  return {
    credits: creditsQuery.data ?? [],
    isLoading: creditsQuery.isLoading,
  };
}
