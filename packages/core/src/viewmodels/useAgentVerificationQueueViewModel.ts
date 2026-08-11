import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentsRepository } from '../services/agentsRepository';

// Staff review queue for self-service agent applications — mirrors
// useVerificationQueueViewModel.ts's shape exactly (the listing-verification
// equivalent), just backed by GET /agents/pending-verification /
// PATCH /agents/:id/verify instead.
export function useAgentVerificationQueueViewModel() {
  const queryClient = useQueryClient();
  const queryKey = ['agents', 'pending-verification'];

  const query = useQuery({
    queryKey,
    queryFn: agentsRepository.listPendingVerification,
  });

  const act = useMutation({
    mutationFn: (input: { agentId: string; status: 'verified' | 'rejected'; reason?: string }) =>
      agentsRepository.setVerificationStatus(input.agentId, input.status, input.reason),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    queue: query.data ?? [],
    isLoading: query.isLoading,
    act,
  };
}
