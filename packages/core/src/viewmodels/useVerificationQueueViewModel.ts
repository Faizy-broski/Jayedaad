import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { verificationRepository, VerificationAction } from '../services/verificationRepository';

export function useVerificationQueueViewModel() {
  const queryClient = useQueryClient();
  const queryKey = ['verification', 'queue'];

  const query = useQuery({
    queryKey,
    queryFn: verificationRepository.queue,
  });

  const act = useMutation({
    mutationFn: (input: { listingId: string; action: VerificationAction; note?: string }) =>
      verificationRepository.act(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    queue: query.data ?? [],
    isLoading: query.isLoading,
    act,
  };
}
