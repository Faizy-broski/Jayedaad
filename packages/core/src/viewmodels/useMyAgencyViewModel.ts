import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agenciesRepository } from '../services/agenciesRepository';
import { UpdateAgencyInput } from '../models';
import { useAgentProfileViewModel } from './useAgentProfileViewModel';

// Self-service agency-details read/write for the signed-in agent's own
// agency — previously this had no UI or wiring anywhere (web or mobile):
// registerSelfService() at signup set name/city/phone once, and the only
// other write path was the Super Admin's admin/agencies panel. Sourced off
// useAgentProfileViewModel's profile.agency.slug (findBySlug is public and
// always returns the full Agency row, unlike the partial one embedded in
// AgentProfileSummary) — enabled only once that's loaded, so this is a
// no-op for an agent with no agency (or any non-agent role).
export function useMyAgencyViewModel() {
  const { profile } = useAgentProfileViewModel();
  const agencyId = profile?.agency?.id;
  const agencySlug = profile?.agency?.slug;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['agencies', agencySlug, 'mine'],
    queryFn: () => agenciesRepository.findBySlug(agencySlug!),
    enabled: !!agencySlug,
  });

  const update = useMutation({
    mutationFn: (input: UpdateAgencyInput) => agenciesRepository.update(agencyId!, input),
    onSuccess: (agency) => queryClient.setQueryData(['agencies', agencySlug, 'mine'], agency),
  });

  return {
    agency: query.data,
    isLoading: query.isLoading,
    isAgencyAdmin: !!profile?.isAgencyAdmin,
    update,
  };
}
