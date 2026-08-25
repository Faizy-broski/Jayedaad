import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsRepository, MarkRentedInput, MarkSoldInput } from '../services/dealsRepository';

// Drives the Property Management "Mark Sold"/"Mark Rented" actions — same
// mutation shape as useMyListingsViewModel's boost/renew/refresh (a
// standalone hook rather than folded into that viewmodel since Mark Sold/
// Rented needs its own per-listing input form, not a filter-driven list).
// Invalidates every query surface a new deal can change the numbers on:
// the My Listings table (status badge flips to sold/rented), that
// listing's own analytics/detail (Performance page), and any revenue query
// (Revenue page) — matches boost's credits-invalidation pattern of
// widening past its own list to whatever else the write affects.
export function useMarkDealViewModel() {
  const queryClient = useQueryClient();

  const invalidateAfterDeal = (listingId: string) => {
    queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['listings', listingId] });
    queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'agents' && query.queryKey.includes('revenue') });
  };

  const markSold = useMutation({
    mutationFn: ({ listingId, input }: { listingId: string; input: MarkSoldInput }) =>
      dealsRepository.markSold(listingId, input),
    onSuccess: (_data, { listingId }) => invalidateAfterDeal(listingId),
  });

  const markRented = useMutation({
    mutationFn: ({ listingId, input }: { listingId: string; input: MarkRentedInput }) =>
      dealsRepository.markRented(listingId, input),
    onSuccess: (_data, { listingId }) => invalidateAfterDeal(listingId),
  });

  return { markSold, markRented };
}
