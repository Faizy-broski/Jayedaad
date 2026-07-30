import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsRepository } from '../services/subscriptionsRepository';
// Super Admin plan management — tier CRUD plus assigning a plan to any agent.
export function usePlanManagementViewModel() {
    const queryClient = useQueryClient();
    const tiersKey = ['subscription-tiers'];
    const tiersQuery = useQuery({
        queryKey: tiersKey,
        queryFn: subscriptionsRepository.listTiers,
    });
    const invalidateTiers = () => queryClient.invalidateQueries({ queryKey: tiersKey });
    const createTier = useMutation({
        mutationFn: (input) => subscriptionsRepository.createTier(input),
        onSuccess: invalidateTiers,
    });
    const updateTier = useMutation({
        mutationFn: ({ id, input }) => subscriptionsRepository.updateTier(id, input),
        onSuccess: invalidateTiers,
    });
    const removeTier = useMutation({
        mutationFn: (id) => subscriptionsRepository.removeTier(id),
        onSuccess: invalidateTiers,
    });
    const assignToAgent = useMutation({
        mutationFn: ({ agentId, input }) => subscriptionsRepository.assignToAgent(agentId, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'agents-overview'] }),
    });
    return {
        tiers: tiersQuery.data ?? [],
        isLoading: tiersQuery.isLoading,
        createTier,
        updateTier,
        removeTier,
        assignToAgent,
    };
}
