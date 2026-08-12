import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agenciesRepository } from '../services/agenciesRepository';
import { adminRepository } from '../services/adminRepository';
import { CreateAgencyInput, SetAgencyTierInput, SetAgencyVerificationStatusInput, UpdateAgencyInput } from '../models';

// Super Admin agency management — full CRUD + verification decision. Rosters
// via GET /admin/agencies (every verification status), not
// agenciesRepository.list()'s public GET /agencies — that one hardcodes
// verified-only for the buyer-facing directory and previously left this
// page showing "0 registered agencies" for any agency still pending/
// rejected review (see admin.repository.ts::listAgenciesOverview).
export function useAgencyManagementViewModel(
  filters: { city?: string; search?: string; verificationStatus?: string; page?: number; pageSize?: number } = {},
) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'agencies', filters];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await adminRepository.listAgenciesOverview(filters);
      // city has no server-side filter (a pre-existing, unused prop — no
      // caller currently passes it) — kept as a client-side narrowing over
      // the current page for backward compatibility, not a full-set filter.
      return filters.city ? { ...result, items: result.items.filter((a) => a.city === filters.city) } : result;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'agencies'] });

  const create = useMutation({
    mutationFn: (input: CreateAgencyInput) => agenciesRepository.create(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAgencyInput }) => agenciesRepository.update(id, input),
    onSuccess: invalidate,
  });

  const setVerificationStatus = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetAgencyVerificationStatusInput }) =>
      agenciesRepository.setVerificationStatus(id, input),
    onSuccess: invalidate,
  });

  // Super Admin-curated Titanium/Featured placement — agenciesRepository.setTier
  // already existed with no caller anywhere, so every agency was
  // permanently stuck at 'basic' regardless of how well-established it was.
  const setTier = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetAgencyTierInput }) => agenciesRepository.setTier(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => agenciesRepository.remove(id),
    onSuccess: invalidate,
  });

  return {
    agencies: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    create,
    update,
    setVerificationStatus,
    setTier,
    remove,
  };
}
