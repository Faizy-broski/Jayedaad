import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsRepository } from '../services/subscriptionsRepository';
import { AssignSubscriptionInput } from '../models';
import { useAuthViewModel } from './useAuthViewModel';

// Drives the agent "Plan" page — current subscription, the tier catalog to
// upgrade/downgrade against, and usage. Also backs the dashboard's "Current
// Plan" figure (previously a hardcoded "-").
export function useSubscriptionViewModel() {
  const { agentId } = useAuthViewModel();
  const queryClient = useQueryClient();

  const currentQuery = useQuery({
    queryKey: ['subscriptions', 'me', agentId],
    queryFn: () => subscriptionsRepository.getMine(),
    enabled: !!agentId,
  });

  const tiersQuery = useQuery({
    queryKey: ['subscription-tiers'],
    queryFn: () => subscriptionsRepository.listTiers(),
    staleTime: 5 * 60_000,
  });

  const usageQuery = useQuery({
    queryKey: ['subscriptions', 'usage', agentId],
    queryFn: () => subscriptionsRepository.getUsage(),
    enabled: !!agentId,
  });

  const selectTier = useMutation({
    mutationFn: (input: AssignSubscriptionInput) => subscriptionsRepository.selectTier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'me', agentId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'usage', agentId] });
    },
  });

  return {
    current: currentQuery.data,
    isCurrentLoading: currentQuery.isLoading,
    tiers: tiersQuery.data ?? [],
    isTiersLoading: tiersQuery.isLoading,
    usage: usageQuery.data,
    selectTier,
  };
}
