import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListTiersFilters, PaginatedTiers, subscriptionsRepository } from '../services/subscriptionsRepository';
import { AssignSubscriptionInput, CreateSubscriptionTierInput, SubscriptionTier, UpdateSubscriptionTierInput } from '../models';

function normalizeTiersResult(data: SubscriptionTier[] | PaginatedTiers | undefined, filters: ListTiersFilters): PaginatedTiers {
  if (!data) return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 20 };
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1, pageSize: data.length || 1 };
  return data;
}

// Super Admin plan management — tier CRUD plus assigning a plan to any
// agent. Dual-mode: called with no page/pageSize, the endpoint returns
// every tier unpaginated; called with page/pageSize (the Plans admin
// table), it paginates. Either way this hook always returns the same
// { tiers, total, page, pageSize } shape so callers don't need to branch.
export function usePlanManagementViewModel(filters: ListTiersFilters = {}) {
  const queryClient = useQueryClient();
  const tiersKey = ['subscription-tiers', filters];

  const tiersQuery = useQuery({
    queryKey: tiersKey,
    queryFn: () => subscriptionsRepository.listTiers(filters),
  });

  const result = normalizeTiersResult(tiersQuery.data, filters);

  const invalidateTiers = () => queryClient.invalidateQueries({ queryKey: ['subscription-tiers'] });

  const createTier = useMutation({
    mutationFn: (input: CreateSubscriptionTierInput) => subscriptionsRepository.createTier(input),
    onSuccess: invalidateTiers,
  });

  const updateTier = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubscriptionTierInput }) =>
      subscriptionsRepository.updateTier(id, input),
    onSuccess: invalidateTiers,
  });

  const removeTier = useMutation({
    mutationFn: (id: string) => subscriptionsRepository.removeTier(id),
    onSuccess: invalidateTiers,
  });

  const assignToAgent = useMutation({
    mutationFn: ({ agentId, input }: { agentId: string; input: AssignSubscriptionInput }) =>
      subscriptionsRepository.assignToAgent(agentId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'agents-overview'] }),
  });

  return {
    tiers: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    isLoading: tiersQuery.isLoading,
    createTier,
    updateTier,
    removeTier,
    assignToAgent,
  };
}
