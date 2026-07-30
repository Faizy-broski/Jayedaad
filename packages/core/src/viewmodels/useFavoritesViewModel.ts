import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesRepository } from '../services/favoritesRepository';
import { useAuthViewModel } from './useAuthViewModel';

// Drives the "Favorites & Saved" screen's Favorites tab — self-scoped, any
// authenticated role.
export function useFavoritesViewModel() {
  const { user } = useAuthViewModel();
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => favoritesRepository.list(),
    enabled: !!user,
  });

  const remove = useMutation({
    mutationFn: (listingId: string) => favoritesRepository.remove(listingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  });

  const add = useMutation({
    mutationFn: (listingId: string) => favoritesRepository.add(listingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  });

  return {
    favorites: favoritesQuery.data ?? [],
    isLoading: favoritesQuery.isLoading,
    add,
    remove,
  };
}
