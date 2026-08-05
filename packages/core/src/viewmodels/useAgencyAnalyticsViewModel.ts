import { useQuery } from '@tanstack/react-query';
import { agenciesRepository } from '../services/agenciesRepository';

// Agency Admin's agency-wide performance rollup (Document Verification
// Phase 3) — admin-only server-side, so this should only ever be called
// when the logged-in agent's profile.isAgencyAdmin is true.
export function useAgencyAnalyticsViewModel(agencyId: string | undefined) {
  const query = useQuery({
    queryKey: ['agencies', agencyId, 'analytics'],
    queryFn: () => agenciesRepository.getStaffAnalytics(agencyId!),
    enabled: !!agencyId,
  });

  return {
    analytics: query.data,
    isLoading: query.isLoading,
  };
}
