import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsRepository } from '../services/subscriptionsRepository';
import { AssignSubscriptionInput, BillingInterval } from '../models';
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
    queryKey: ['subscription-tiers', {}],
    // Called with no filters -> the unpaginated array branch of the
    // dual-mode endpoint (see subscription-tiers.repository.ts::list).
    queryFn: () => subscriptionsRepository.listTiers(),
    select: (data) => (Array.isArray(data) ? data : data.items),
    staleTime: 5 * 60_000,
  });

  const usageQuery = useQuery({
    queryKey: ['subscriptions', 'usage', agentId],
    queryFn: () => subscriptionsRepository.getUsage(),
    enabled: !!agentId,
  });

  // Standalone top-up packs (Buy more credits) — public, same staleTime
  // treatment as the tier catalog since these change rarely.
  const creditPacksQuery = useQuery({
    queryKey: ['credit-packs'],
    queryFn: () => subscriptionsRepository.listCreditPacks(),
    staleTime: 5 * 60_000,
  });

  const selectTier = useMutation({
    mutationFn: (input: AssignSubscriptionInput) => subscriptionsRepository.selectTier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'me', agentId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'usage', agentId] });
    },
  });

  // Paid-tier path — resolves to a Stripe Checkout URL; the caller (Plan
  // page) is responsible for navigating there. No cache invalidation here —
  // nothing changes locally until the webhook fires and the user returns.
  // returnUrl is mobile-only (see subscriptionsRepository.checkoutTier) —
  // web callers omit it.
  const checkoutTier = useMutation({
    mutationFn: ({
      tierId,
      returnUrl,
      billingInterval,
    }: {
      tierId: string;
      returnUrl?: string;
      billingInterval?: BillingInterval;
    }) => subscriptionsRepository.checkoutTier(tierId, returnUrl, billingInterval),
  });

  // cancel_at_period_end via Stripe — no cache invalidation, same reasoning
  // as checkoutTier: the local row only changes once the webhook processes
  // it, not from this call's own response.
  const cancelSubscription = useMutation({
    mutationFn: () => subscriptionsRepository.cancelSubscription(),
  });

  // Resolves to a Stripe billing-portal URL; the caller navigates there.
  const openBillingPortal = useMutation({
    mutationFn: () => subscriptionsRepository.getBillingPortalUrl(),
  });

  // Resolves to a Stripe Checkout URL for a one-off credit pack purchase —
  // same "no local cache change until the webhook fires" reasoning as
  // checkoutTier, same mobile-only returnUrl convention.
  const checkoutCreditPack = useMutation({
    mutationFn: ({ packId, returnUrl }: { packId: string; returnUrl?: string }) =>
      subscriptionsRepository.checkoutCreditPack(packId, returnUrl),
  });

  // Multi-item cart checkout — same "no local cache change until the
  // webhook fires" reasoning as checkoutCreditPack.
  const checkoutCreditCart = useMutation({
    mutationFn: ({ items, returnUrl }: { items: { packId: string; quantity: number }[]; returnUrl?: string }) =>
      subscriptionsRepository.checkoutCreditCart(items, returnUrl),
  });

  return {
    current: currentQuery.data,
    isCurrentLoading: currentQuery.isLoading,
    tiers: tiersQuery.data ?? [],
    isTiersLoading: tiersQuery.isLoading,
    isTiersError: tiersQuery.isError,
    usage: usageQuery.data,
    creditPacks: creditPacksQuery.data ?? [],
    isCreditPacksLoading: creditPacksQuery.isLoading,
    selectTier,
    checkoutTier,
    cancelSubscription,
    openBillingPortal,
    checkoutCreditPack,
    checkoutCreditCart,
  };
}
