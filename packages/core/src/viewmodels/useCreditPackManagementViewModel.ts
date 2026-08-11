import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsRepository } from '../services/subscriptionsRepository';
import { CreateCreditPackInput, UpdateCreditPackInput } from '../models';

// Super Admin credit-pack CRUD — same shape as usePlanManagementViewModel,
// wired to repository methods (createCreditPack/updateCreditPack/
// removeCreditPack) that already existed but had zero callers until this
// pass. includeInactive is always true here: the admin table needs to see
// retired packs too, unlike the agent-facing Plan page's listCreditPacks()
// call (defaults to active-only).
export function useCreditPackManagementViewModel() {
  const queryClient = useQueryClient();
  // Same query key ['credit-packs'] useSubscriptionViewModel's
  // creditPacksQuery uses (with includeInactive omitted there) — React
  // Query keys them separately by argument, so this doesn't collide with
  // or stale that query, but invalidating 'credit-packs' as a prefix below
  // still refreshes both, so an admin edit is picked up by the agent-facing
  // Plan page too.
  const packsQuery = useQuery({
    queryKey: ['credit-packs', { includeInactive: true }],
    queryFn: () => subscriptionsRepository.listCreditPacks(true),
  });

  const invalidatePacks = () => queryClient.invalidateQueries({ queryKey: ['credit-packs'] });

  const createPack = useMutation({
    mutationFn: (input: CreateCreditPackInput) => subscriptionsRepository.createCreditPack(input),
    onSuccess: invalidatePacks,
  });

  const updatePack = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCreditPackInput }) =>
      subscriptionsRepository.updateCreditPack(id, input),
    onSuccess: invalidatePacks,
  });

  const removePack = useMutation({
    mutationFn: (id: string) => subscriptionsRepository.removeCreditPack(id),
    onSuccess: invalidatePacks,
  });

  return {
    packs: packsQuery.data ?? [],
    isLoading: packsQuery.isLoading,
    createPack,
    updatePack,
    removePack,
  };
}
