import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentsRepository, UpdateAgentProfileInput } from '../services/agentsRepository';
import { useAuthViewModel } from './useAuthViewModel';

// Drives the Profolio "User Settings" tab — read/write of the signed-in
// agent's own AgentProfileSummary.
export function useAgentProfileViewModel() {
  const { agentId } = useAuthViewModel();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['agents', agentId, 'profile'],
    queryFn: () => agentsRepository.getProfile(agentId!),
    enabled: !!agentId,
  });

  const updateProfile = useMutation({
    mutationFn: (input: UpdateAgentProfileInput) => agentsRepository.updateProfile(agentId!, input),
    onSuccess: (profile) => {
      queryClient.setQueryData(['agents', agentId, 'profile'], profile);
    },
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: any) => agentsRepository.uploadPhoto(agentId!, file),
    onSuccess: (profile) => {
      queryClient.setQueryData(['agents', agentId, 'profile'], profile);
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateProfile,
    uploadPhoto,
  };
}
