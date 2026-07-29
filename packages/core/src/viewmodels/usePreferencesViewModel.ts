import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesRepository } from '../services/preferencesRepository';
import { UserPreferences } from '../models';
import { useAuthViewModel } from './useAuthViewModel';

// Drives the Profolio "Preferences" tab — self-scoped to whichever role is
// signed in (not agent-only, unlike useAgentProfileViewModel).
export function usePreferencesViewModel() {
  const { user } = useAuthViewModel();
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: () => preferencesRepository.get(),
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: (input: Partial<UserPreferences>) => preferencesRepository.update(input),
    onSuccess: (preferences) => {
      queryClient.setQueryData(['preferences', user?.id], preferences);
    },
  });

  return {
    preferences: preferencesQuery.data,
    isLoading: preferencesQuery.isLoading,
    updatePreferences,
  };
}
