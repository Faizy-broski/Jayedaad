import { useQuery } from '@tanstack/react-query';
import { agenciesRepository } from '../services/agenciesRepository';
import { AgencySearchFilters } from '../models';

// Public Agents directory (apps/web /agents) — Titanium/Featured tier strips
// and the searchable/paginated grid all go through this one hook, same
// shape as useProjectsViewModel.
export function useAgenciesViewModel(filters: AgencySearchFilters = {}) {
  const query = useQuery({
    queryKey: ['agencies', 'public', filters],
    queryFn: () => agenciesRepository.searchPublic(filters),
  });

  return {
    agencies: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    pageSize: query.data?.pageSize ?? 20,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

// Public Agency detail page (apps/web /agents/[slug]) — combines the agency
// row (+ embedded staff roster) with its computed for-sale/for-rent stats,
// same two-query split as useListingDetailViewModel's listing+similar.
export function useAgencyDetailViewModel(slug: string | undefined) {
  const agencyQuery = useQuery({
    queryKey: ['agencies', 'public', 'detail', slug],
    queryFn: () => agenciesRepository.findBySlug(slug!),
    enabled: !!slug,
  });

  const statsQuery = useQuery({
    queryKey: ['agencies', 'public', 'detail', slug, 'stats'],
    queryFn: () => agenciesRepository.getStats(slug!),
    enabled: !!slug,
  });

  return {
    agency: agencyQuery.data,
    isLoading: agencyQuery.isLoading,
    error: agencyQuery.error,
    stats: statsQuery.data,
    isStatsLoading: statsQuery.isLoading,
  };
}

// Backs "Browse Agencies By City".
export function useAgencyCitiesViewModel() {
  const query = useQuery({
    queryKey: ['agencies', 'cities'],
    queryFn: () => agenciesRepository.listCities(),
  });

  return {
    cities: query.data ?? [],
    isLoading: query.isLoading,
  };
}
