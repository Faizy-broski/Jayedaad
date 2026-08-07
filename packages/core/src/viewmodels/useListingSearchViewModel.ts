import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { listingsRepository, ListingSearchFilters } from '../services/listingsRepository';

// searchPublic now returns a page ({ items, total, page, pageSize }), not a
// bare array — this adapts it back to a flat `listings` array so existing
// consumers (apps/web's search page) need no changes, while still exposing
// total/page/pageSize for whenever pagination UI gets built.
export function useListingSearchViewModel(filters: ListingSearchFilters) {
  const query = useQuery({
    queryKey: ['listings', 'public', filters],
    queryFn: () => listingsRepository.searchPublic(filters),
  });

  return {
    listings: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    pageSize: query.data?.pageSize ?? 20,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Sitewide "most visited" — GET /listings/trending, ranked by real 'view'
// events off listing_engagement_events. Backs the homepage's Most Visited
// section, distinct from the "newest" proxy FeaturedPropertiesSection uses.
export function useTrendingListingsViewModel(limit?: number) {
  const query = useQuery({
    queryKey: ['listings', 'trending', limit],
    queryFn: () => listingsRepository.findMostViewed(limit),
    staleTime: 5 * 60_000,
  });

  return {
    listings: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Infinite-scroll variant — backs mobile's AllPropertiesScreen/
// BuyerSearchScreen "load more on scroll" results, fetching real 20-item
// pages (the API's own DEFAULT_PAGE_SIZE) instead of one big unbounded
// fetch. Same real GET /listings endpoint as the plain query above, just
// paged through via fetchNextPage.
export function useInfiniteListingSearchViewModel(filters: ListingSearchFilters) {
  const query = useInfiniteQuery({
    queryKey: ['listings', 'public', 'infinite', filters],
    queryFn: ({ pageParam }) => listingsRepository.searchPublic({ ...filters, page: pageParam, pageSize: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined),
  });

  return {
    listings: query.data?.pages.flatMap((p) => p.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
  };
}
