import { useQuery } from '@tanstack/react-query';
import { listingsRepository } from '../services/listingsRepository';
// searchPublic now returns a page ({ items, total, page, pageSize }), not a
// bare array — this adapts it back to a flat `listings` array so existing
// consumers (apps/web's search page) need no changes, while still exposing
// total/page/pageSize for whenever pagination UI gets built.
export function useListingSearchViewModel(filters) {
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
