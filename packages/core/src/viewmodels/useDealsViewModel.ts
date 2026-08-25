import { useQuery } from '@tanstack/react-query';
import { dealsRepository, DealListFilters } from '../services/dealsRepository';
import { Deal } from '../models';

// Drives the Deals ledger page — server-side paginated/filtered, same shape
// as useLeadInboxViewModel minus the optimistic status mutations (deals
// have no editable status once closed).
export function useDealsViewModel(filters: DealListFilters) {
  const query = useQuery({
    queryKey: ['deals', filters],
    queryFn: () => dealsRepository.list(filters),
  });

  return {
    deals: query.data?.items ?? ([] as Deal[]),
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
