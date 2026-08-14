import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsRepository, LeadListFilters } from '../services/leadsRepository';
import { Lead, LeadListResult, LeadStatus } from '../models';

// Drives the CRM inquiry inbox. Optimistic status updates here are what
// satisfy [Dev Instr §1] "minimize clicks... feels instant" for the
// highest-frequency CRM action. Server-side paginated (see
// LeadsRepository.list's count/range on the API side) — a busy agent's
// inbox can't load every lead at once. refetchInterval keeps the inbox
// reasonably live without websocket infra — a new lead appears within 30s
// of arriving instead of only after a manual reload/refocus.
export function useLeadInboxViewModel(filters: LeadListFilters) {
  const queryClient = useQueryClient();
  const queryKey = ['leads', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => leadsRepository.list(filters),
    refetchInterval: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: leadsRepository.updateStatus,
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
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const addNote = useMutation({
    mutationFn: ({ leadId, body }: { leadId: string; body: string }) => leadsRepository.addNote(leadId, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
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
    isRefetching: query.isRefetching,
    updateStatus,
    addNote,
  };
}

// Single-lead detail — backs LeadDetailScreen.tsx (mobile), which previously
// had no detail view at all (the inbox row itself was the only place any
// lead data ever showed). Same shape of mutations as the inbox above, minus
// the optimistic-update plumbing (a detail screen re-fetching on settle is
// fine — it's not the same "feels instant, high-frequency" surface).
export function useLeadDetailViewModel(leadId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['leads', 'detail', leadId];

  const query = useQuery({
    queryKey,
    queryFn: () => leadsRepository.findById(leadId!),
    enabled: !!leadId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] });
  };

  const updateStatus = useMutation({
    mutationFn: ({ status }: { status: LeadStatus }) => leadsRepository.updateStatus({ leadId: leadId!, status }),
    onSuccess: invalidate,
  });

  const addNote = useMutation({
    mutationFn: (body: string) => leadsRepository.addNote(leadId!, body),
    onSuccess: invalidate,
  });

  return {
    lead: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    updateStatus,
    addNote,
  };
}
