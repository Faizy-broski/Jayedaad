import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agenciesRepository } from '../services/agenciesRepository';
import { CreateAgencyInput, SetAgencyTierInput, SetAgencyVerificationStatusInput, UpdateAgencyInput } from '../models';

// Super Admin agency management — full CRUD + verification decision.
export function useAgencyManagementViewModel(filters: { city?: string } = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'agencies', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => agenciesRepository.list(filters),
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

  const remove = useMutation({
    mutationFn: (id: string) => agenciesRepository.remove(id),
    onSuccess: invalidate,
  });

  // Titanium/Featured placement for the public Agents directory — Super
  // Admin-only, separate write-mechanism from update() above (see
  // AgenciesRepository.setTier).
  const setTier = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetAgencyTierInput }) => agenciesRepository.setTier(id, input),
    onSuccess: invalidate,
  });

  return {
    agencies: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    setVerificationStatus,
    setTier,
    remove,
  };
}
