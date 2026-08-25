import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportRepository, SupportTicketFilters } from '../services/supportRepository';
import { UpdateSupportTicketStatusInput } from '../models';

// Super Admin help-desk management (apps/web /admin/support) — every
// submitted ticket, filterable by status, with a status-only update action
// (no reply thread, per the confirmed scope).
export function useAdminSupportViewModel(filters: SupportTicketFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'support', 'tickets', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => supportRepository.listAll(filters),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });

  const updateStatus = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupportTicketStatusInput }) => supportRepository.updateStatus(id, input),
    onSuccess: invalidate,
  });

  // Super Admin can remove any ticket regardless of status — see
  // support.repository.ts::remove's role branch.
  const remove = useMutation({
    mutationFn: (id: string) => supportRepository.remove(id),
    onSuccess: invalidate,
  });

  // Hands a ticket off to a specific verification_staff member — the
  // eligible-staff list itself comes from useUserManagementViewModel({
  // roles: ['verification_staff'] }) at the call site (same "team members"
  // roster the Users admin page already uses), not duplicated here.
  const assign = useMutation({
    mutationFn: ({ id, staffId }: { id: string; staffId: string }) => supportRepository.assign(id, staffId),
    onSuccess: invalidate,
  });

  return {
    tickets: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    updateStatus,
    remove,
    assign,
  };
}
