import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savedSearchesRepository } from '../services/savedSearchesRepository';
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
    const remove = useMutation({
        mutationFn: (id) => savedSearchesRepository.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedSearches', user?.id] }),
    });
    return {
        savedSearches: savedSearchesQuery.data ?? [],
        isLoading: savedSearchesQuery.isLoading,
        remove,
    };
}
