import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateSavedSearchInput, savedSearchesRepository } from '../services/savedSearchesRepository';
import { AlertFrequency } from '../models';
import { useAuthViewModel } from './useAuthViewModel';

// Drives the "Favorites & Saved" screen's Saved Searches tab — self-scoped,
// any authenticated role.
export function useSavedSearchesViewModel() {
  const { user } = useAuthViewModel();
  const queryClient = useQueryClient();

  const savedSearchesQuery = useQuery({
    queryKey: ['savedSearches', user?.id],
    queryFn: () => savedSearchesRepository.list(),
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['savedSearches', user?.id] });

  const create = useMutation({
    mutationFn: (input: CreateSavedSearchInput) => savedSearchesRepository.create(input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => savedSearchesRepository.remove(id),
    onSuccess: invalidate,
  });

  const updateAlertFrequency = useMutation({
    mutationFn: ({ id, alertFrequency }: { id: string; alertFrequency: AlertFrequency }) =>
      savedSearchesRepository.updateAlertFrequency(id, alertFrequency),
    onSuccess: invalidate,
  });

  return {
    savedSearches: savedSearchesQuery.data ?? [],
    isLoading: savedSearchesQuery.isLoading,
    refetch: savedSearchesQuery.refetch,
    isRefetching: savedSearchesQuery.isRefetching,
    create,
    remove,
    updateAlertFrequency,
  };
}
