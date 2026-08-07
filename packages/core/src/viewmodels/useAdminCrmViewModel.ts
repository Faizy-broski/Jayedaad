import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsRepository, LeadListFilters } from '../services/leadsRepository';
import { Lead, LeadListResult, LeadStatus } from '../models';

// Super Admin cross-agent CRM — same GET /crm/leads endpoint the agent
// Inbox uses, but unscoped (every agent's leads) with an optional agentId
// filter to view one agent's CRM at a time, plus reassign and delete
// actions. Server-side paginated and polled every 30s, same as
// useLeadInboxViewModel.
export function useAdminCrmViewModel(filters: LeadListFilters) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'leads', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => leadsRepository.list(filters),
    refetchInterval: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] });

  const updateStatus = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: LeadStatus }) => leadsRepository.updateStatus({ leadId, status }),
    onMutate: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LeadListResult>(queryKey);
      queryClient.setQueryData<LeadListResult>(queryKey, (result) =>
        result
          ? { ...result, items: result.items.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)) }
          : result,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: invalidate,
  });

  const addNote = useMutation({
    mutationFn: ({ leadId, body }: { leadId: string; body: string }) => leadsRepository.addNote(leadId, body),
    onSettled: invalidate,
  });

  const assign = useMutation({
    mutationFn: ({ leadId, agentId }: { leadId: string; agentId: string }) => leadsRepository.assign(leadId, agentId),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (leadId: string) => leadsRepository.remove(leadId),
    onSuccess: invalidate,
  });

  return {
    leads: query.data?.items ?? ([] as Lead[]),
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateStatus,
    addNote,
    assign,
    remove,
  };
}

// Stat-tile counts (Total/New/Unassigned/Closed) — now that list() is
// server-side paginated, computing these from whatever page happens to be
// loaded would silently under-count. Four lightweight, parallel
// pageSize: 1 queries (only `total` is read from each), same "count-only
// query per tile" convention as apps/mobile's HomeScreen.tsx category tiles
// — cheap since a paginated query only reads/returns one row's data.
export function useAdminCrmStatsViewModel(agentId?: string) {
  const base = { agentId, pageSize: 1 };
  const results = useQueries({
    queries: [
      { queryKey: ['admin', 'leads', 'stats', 'total', agentId], queryFn: () => leadsRepository.list(base) },
      { queryKey: ['admin', 'leads', 'stats', 'new', agentId], queryFn: () => leadsRepository.list({ ...base, status: 'new' }) },
      {
        queryKey: ['admin', 'leads', 'stats', 'unassigned', agentId],
        queryFn: () => leadsRepository.list({ ...base, unassigned: true }),
      },
      { queryKey: ['admin', 'leads', 'stats', 'closed', agentId], queryFn: () => leadsRepository.list({ ...base, status: 'closed' }) },
    ],
  });
  const [total, newCount, unassigned, closed] = results;

  return {
    total: total.data?.total ?? 0,
    new: newCount.data?.total ?? 0,
    unassigned: unassigned.data?.total ?? 0,
    closed: closed.data?.total ?? 0,
    isLoading: results.some((r) => r.isLoading),
  };
}
