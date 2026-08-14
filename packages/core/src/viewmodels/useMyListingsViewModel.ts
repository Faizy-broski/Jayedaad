import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateListingInput, listingsRepository, MyListingsFilters } from '../services/listingsRepository';
import { BoostListingInput } from '../models';
import { useAuthViewModel } from './useAuthViewModel';

// Drives the Profolio-style "My Listings" page — status tabs (with count
// badges) plus a filtered/paginated list. GET /listings/mine is role-aware
// server-side (owner sees own submissions, agent sees assigned, super_admin
// sees all), so this gates on any signed-in user, not agentId specifically
// (unlike useAgentDashboardViewModel, which is agent-only).
export function useMyListingsViewModel(filters: MyListingsFilters) {
  const { user } = useAuthViewModel();
  const queryClient = useQueryClient();

  const listingsQuery = useQuery({
    queryKey: ['listings', 'mine', filters],
    queryFn: () => listingsRepository.findMine(filters),
    enabled: !!user,
  });

  const statusCountsQuery = useQuery({
    queryKey: ['listings', 'mine', 'status-counts'],
    queryFn: () => listingsRepository.getMyStatusCounts(),
    enabled: !!user,
  });

  // Edit/delete on the Property Management page — invalidating the
  // ['listings','mine'] prefix refreshes both this list (any filter combo)
  // and the status-count tabs, same pattern as every other mutation this
  // session.
  const update = useMutation({
    mutationFn: ({ listingId, input }: { listingId: string; input: Partial<CreateListingInput> }) =>
      listingsRepository.updateListing(listingId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] }),
  });

  const remove = useMutation({
    mutationFn: (listingId: string) => listingsRepository.deleteListing(listingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] }),
  });

  // Moves a draft row into the verification queue — the Drafts tab's
  // "Submit for Verification" action.
  const submitForVerification = useMutation({
    mutationFn: (listingId: string) => listingsRepository.submitDraft(listingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] }),
  });

  // Spends a Hot/Super Hot credit to feature a listing — the Property
  // Management "Boost" action. Also invalidates the ['agents', agentId,
  // 'credits'] query (useAgentCreditsViewModel) — without this, a balance
  // shown next to the Boost/Refresh/Story buttons would go stale after a
  // successful spend until an unrelated refetch happened to occur.
  const boost = useMutation({
    mutationFn: ({ listingId, input }: { listingId: string; input: BoostListingInput }) =>
      listingsRepository.boostListing(listingId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['agents', 'credits'] });
    },
  });

  // Resets an expired listing back to 'verified' with a fresh expiry — the
  // Expired tab's "Renew" action.
  const renew = useMutation({
    mutationFn: (listingId: string) => listingsRepository.renewListing(listingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] }),
  });

  // Spends a Refresh credit to bump a listing's sort position — the
  // Property Management "Refresh" action, alongside Boost. Same credits
  // invalidation as boost above.
  const refresh = useMutation({
    mutationFn: (listingId: string) => listingsRepository.refreshListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['agents', 'credits'] });
    },
  });

  // Spends a Story credit to feature a listing for 24h — the Property
  // Management "Story" action, alongside Boost/Refresh. Same credits
  // invalidation as boost above.
  const postStory = useMutation({
    mutationFn: (listingId: string) => listingsRepository.postListingStory(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['agents', 'credits'] });
    },
  });

  return {
    listings: listingsQuery.data?.items ?? [],
    total: listingsQuery.data?.total ?? 0,
    page: listingsQuery.data?.page ?? filters.page ?? 1,
    pageSize: listingsQuery.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: listingsQuery.isLoading,
    isError: listingsQuery.isError,
    // Named distinctly from `refresh` below — that's an unrelated paid
    // mutation (spends a "Refresh credit" to bump sort position), not a
    // cache refetch. Pull-to-refresh call sites want these two, not that.
    refetchListings: listingsQuery.refetch,
    isRefetchingListings: listingsQuery.isRefetching,
    statusCounts: statusCountsQuery.data ?? {},
    isStatusCountsLoading: statusCountsQuery.isLoading,
    update,
    remove,
    submitForVerification,
    boost,
    renew,
    refresh,
    postStory,
  };
}
