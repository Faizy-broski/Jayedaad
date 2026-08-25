import { useQuery } from '@tanstack/react-query';
import { opportunitiesRepository, OpportunityFunnelFilters } from '../services/opportunitiesRepository';

// Drives the funnel/analytics section (Phase 4 of the CRM maturity
// build-out) — plain query, no mutations, mirrors useDealsViewModel's
// minimal shape.
export function useOpportunityFunnelViewModel(filters: OpportunityFunnelFilters = {}) {
  const query = useQuery({
    queryKey: ['opportunities', 'funnel', filters],
    queryFn: () => opportunitiesRepository.getFunnel(filters),
  });

  return {
    funnel: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
