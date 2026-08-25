import { useQuery } from '@tanstack/react-query';
import { supportRepository } from '../services/supportRepository';
import { SupportTicketStatus } from '../models';

// verification_staff-facing (apps/web (verification)/verification/tickets)
// — the "assigned to me" queue (GET /support/tickets/assigned), read-only:
// working a ticket still happens through Super Admin's status/note update,
// same "no reply thread" scope as the rest of this help-desk system — this
// view exists so staff can SEE what's been handed to them, not act on it
// independently (that boundary wasn't asked for and isn't assumed here).
export function useAssignedSupportTicketsViewModel(filters: { status?: SupportTicketStatus; page?: number; pageSize?: number } = {}) {
  const query = useQuery({
    queryKey: ['support', 'tickets', 'assigned', filters],
    queryFn: () => supportRepository.listAssigned(filters),
  });

  return {
    tickets: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
