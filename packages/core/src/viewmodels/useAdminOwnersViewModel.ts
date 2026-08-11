import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownersRepository } from '../services/ownersRepository';

// Staff review queue for owner identity verification — mirrors
// useAdminAgentsViewModel's verify/reject action, backing a new
// admin/owners page.
export function useAdminOwnersViewModel() {
  const queryClient = useQueryClient();
  const queryKey = ['owners', 'pending-verification'];

  const query = useQuery({
    queryKey,
    queryFn: ownersRepository.listPendingVerification,
  });

  const setVerificationStatus = useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: 'verified' | 'rejected'; reason?: string }) =>
      ownersRepository.setVerificationStatus(userId, status, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    owners: query.data ?? [],
    isLoading: query.isLoading,
    setVerificationStatus,
  };
}
