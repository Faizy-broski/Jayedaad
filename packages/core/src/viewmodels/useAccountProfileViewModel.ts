import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountRepository, UpdateOwnProfileInput } from '../services/accountRepository';
import { useAuthViewModel } from './useAuthViewModel';

// Self-scoped counterpart to useAgentProfileViewModel — drives the
// non-agent branch of ProfileSettingsScreen (buyer/owner/staff/admin).
// Previously this screen had no read path at all (only a bare updateProfile
// mutation), so fields already saved at signup — like phone — never showed
// up here.
export function useAccountProfileViewModel() {
  const { user } = useAuthViewModel();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['account', 'profile', user?.id],
    queryFn: () => accountRepository.getProfile(),
    enabled: !!user,
  });

  const invalidate = (profile: unknown) => queryClient.setQueryData(['account', 'profile', user?.id], profile);

  const updateProfile = useMutation({
    mutationFn: (input: UpdateOwnProfileInput) => accountRepository.updateProfile(input),
    onSuccess: invalidate,
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: any) => accountRepository.uploadPhoto(file),
    onSuccess: invalidate,
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateProfile,
    uploadPhoto,
  };
}
