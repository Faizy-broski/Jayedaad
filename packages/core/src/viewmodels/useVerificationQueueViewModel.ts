import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { verificationRepository, VerificationAction, VerificationQueueFilters } from '../services/verificationRepository';

export function useVerificationQueueViewModel(filters: VerificationQueueFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['verification', 'queue', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => verificationRepository.queue(filters),
  });

  const act = useMutation({
    mutationFn: (input: { listingId: string; action: VerificationAction; note?: string }) =>
      verificationRepository.act(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['verification', 'queue'] }),
  });

  return {
    queue: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    act,
  };
}
