import { useQuery } from '@tanstack/react-query';
import { listingsRepository } from '../services/listingsRepository';

// Backs a real listing-detail screen — listingsRepository.findById/
// findSimilar already existed but had no caller anywhere (no detail page
// existed on either platform to attach to). Public data, no auth required.
export function useListingDetailViewModel(listingId: string | undefined) {
  const listingQuery = useQuery({
    queryKey: ['listings', listingId],
    queryFn: () => listingsRepository.findById(listingId!),
    enabled: !!listingId,
  });

  const similarQuery = useQuery({
    queryKey: ['listings', listingId, 'similar'],
    queryFn: () => listingsRepository.findSimilar(listingId!),
    enabled: !!listingId,
  });

  return {
    listing: listingQuery.data,
    isLoading: listingQuery.isLoading,
    error: listingQuery.error,
    similar: similarQuery.data ?? [],
    isSimilarLoading: similarQuery.isLoading,
  };
}
