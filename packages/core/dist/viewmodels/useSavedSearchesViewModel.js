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
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['savedSearches', user?.id] });
    const create = useMutation({
        mutationFn: (input) => savedSearchesRepository.create(input),
        onSuccess: invalidate,
    });
    const remove = useMutation({
        mutationFn: (id) => savedSearchesRepository.remove(id),
        onSuccess: invalidate,
    });
    return {
        savedSearches: savedSearchesQuery.data ?? [],
        isLoading: savedSearchesQuery.isLoading,
        create,
        remove,
    };
}
