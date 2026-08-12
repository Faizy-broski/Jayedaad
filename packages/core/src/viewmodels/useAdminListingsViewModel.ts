import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listingsRepository, MyListingsFilters } from '../services/listingsRepository';
import { ListingStatus } from '../models';

// Super Admin admin-wide listings — GET /listings/mine is already unscoped
// server-side for super_admin (returns every listing, not just their own),
// plus the super_admin-only direct status override endpoint.
export function useAdminListingsViewModel(filters: MyListingsFilters) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'listings', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => listingsRepository.findMine(filters),
  });

  const statusCountsQuery = useQuery({
    queryKey: ['admin', 'listings', 'status-counts'],
    queryFn: () => listingsRepository.getMyStatusCounts(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });

  const setStatus = useMutation({
    mutationFn: ({ listingId, status }: { listingId: string; status: ListingStatus }) =>
      listingsRepository.setStatus(listingId, status),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (listingId: string) => listingsRepository.deleteListing(listingId),
    onSuccess: invalidate,
  });

  return {
    listings: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    isError: query.isError,
    statusCounts: statusCountsQuery.data ?? {},
    setStatus,
    remove,
  };
}

// A single listing's full detail, for the admin listing-detail page — GET
// /listings/mine is already unscoped for super_admin (unlike GET /listings/:id,
// which is public/verified-only and would 404 on a pending/rejected listing).
export function useAdminListingDetailViewModel(listingId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'listing-detail', listingId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { items } = await listingsRepository.findMine({ listingId, pageSize: 1 });
      return items[0] ?? null;
    },
    enabled: !!listingId,
  });

  const setStatus = useMutation({
    mutationFn: ({ status }: { status: ListingStatus }) => listingsRepository.setStatus(listingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
    },
  });

  return {
    listing: query.data,
    isLoading: query.isLoading,
    setStatus,
  };
}
