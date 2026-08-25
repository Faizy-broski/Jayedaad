import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentsRepository } from '../services/agentsRepository';
import { CreateListingInput, listingsRepository, MyListingsFilters } from '../services/listingsRepository';
import { BoostListingInput, Listing, ListingAnalytics } from '../models';
import { useAuthViewModel } from './useAuthViewModel';

// Extends Listing with the batch per-listing analytics merged in below —
// left local to this viewmodel rather than added onto the shared Listing
// type, since analytics is only ever populated here.
export type ListingWithAnalytics = Listing & { analytics?: ListingAnalytics };

// Drives the Profolio-style "My Listings" page — status tabs (with count
// badges) plus a filtered/paginated list. GET /listings/mine is role-aware
// server-side (owner sees own submissions, agent sees assigned, super_admin
// sees all), so this gates on any signed-in user, not agentId specifically
// (unlike useAgentDashboardViewModel, which is agent-only).
export function useMyListingsViewModel(filters: MyListingsFilters) {
  const { user, agentId } = useAuthViewModel();
  const queryClient = useQueryClient();

  // Defaults to 'own' — matches the API's default and LeadListFilters.scope
  // convention. Agency Admin passes 'agency' to widen to every associate.
  const scope = filters.scope ?? 'own';
  const scopedFilters = { ...filters, scope };

  const listingsQuery = useQuery({
    queryKey: ['listings', 'mine', scopedFilters],
    queryFn: () => listingsRepository.findMine(scopedFilters),
    enabled: !!user,
  });

  const statusCountsQuery = useQuery({
    queryKey: ['listings', 'mine', 'status-counts', scope],
    queryFn: () => listingsRepository.getMyStatusCounts(),
    enabled: !!user,
  });

  // Per-listing performance breakdown for the current page — a secondary
  // query, same graceful-degrade convention as useAgentDashboardViewModel's
  // recentListingsQuery: a slow/failed fetch here never blocks the listings
  // themselves from rendering, it just leaves `analytics` undefined per row.
  const analyticsQuery = useQuery({
    queryKey: ['agents', agentId, 'listings', 'analytics', scope],
    queryFn: () => agentsRepository.getListingsAnalytics(agentId!, scope),
    enabled: !!agentId,
  });

  const listingsWithAnalytics: ListingWithAnalytics[] = (listingsQuery.data?.items ?? []).map((listing) => ({
    ...listing,
    analytics: analyticsQuery.data?.find((row) => row.listingId === listing.id),
  }));

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
    listings: listingsWithAnalytics,
    total: listingsQuery.data?.total ?? 0,
    page: listingsQuery.data?.page ?? filters.page ?? 1,
    pageSize: listingsQuery.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: listingsQuery.isLoading,
    isError: listingsQuery.isError,
    isListingsAnalyticsLoading: analyticsQuery.isLoading,
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
