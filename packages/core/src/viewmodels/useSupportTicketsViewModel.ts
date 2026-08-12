import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportRepository } from '../services/supportRepository';
import { CreateSupportTicketInput, UpdateSupportTicketInput } from '../models';

// Agent-facing help desk (apps/web /help) — submit a new ticket, see your
// own past submissions and their status.
export function useSupportTicketsViewModel(filters: { page?: number; pageSize?: number } = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['support', 'tickets', 'mine', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => supportRepository.listMine(filters),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['support', 'tickets', 'mine'] });

  const submit = useMutation({
    mutationFn: (input: CreateSupportTicketInput) => supportRepository.submit(input),
    onSuccess: invalidate,
  });

  // Both only ever succeed server-side while the ticket is still 'open' —
  // see support.repository.ts::assertOwnOpenTicket.
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupportTicketInput }) => supportRepository.update(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => supportRepository.remove(id),
    onSuccess: invalidate,
  });

  return {
    tickets: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    isError: query.isError,
    submit,
    update,
    remove,
  };
}
