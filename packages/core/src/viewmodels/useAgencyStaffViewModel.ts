import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agenciesRepository } from '../services/agenciesRepository';
import { CreateAgencyStaffInput } from '../models';

// Agency self-management ("Agency Staff") — reachable by an agency's own
// isAgencyAdmin=true agent, or super_admin. The server enforces the real
// boundary (agencies.controller.ts::assertCanManageStaff); this viewmodel
// just wires the endpoints.
export function useAgencyStaffViewModel(agencyId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['agencies', agencyId, 'staff'];

  const query = useQuery({
    queryKey,
    queryFn: () => agenciesRepository.listStaff(agencyId),
    enabled: !!agencyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addStaff = useMutation({
    mutationFn: (input: CreateAgencyStaffInput) => agenciesRepository.addStaff(agencyId, input),
    onSuccess: invalidate,
  });

  const setStaffAdmin = useMutation({
    mutationFn: ({ agentId, isAgencyAdmin }: { agentId: string; isAgencyAdmin: boolean }) =>
      agenciesRepository.setStaffAdmin(agencyId, agentId, isAgencyAdmin),
    onSuccess: invalidate,
  });

  const removeStaff = useMutation({
    mutationFn: (agentId: string) => agenciesRepository.removeStaff(agencyId, agentId),
    onSuccess: invalidate,
  });

  return {
    staff: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addStaff,
    setStaffAdmin,
    removeStaff,
  };
}
