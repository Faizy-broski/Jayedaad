import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsRepository, LeadListFilters } from '../services/leadsRepository';
import { Lead, LeadStatus } from '../models';

// Super Admin cross-agent CRM — same GET /crm/leads endpoint the agent
// Inbox uses, but unscoped (every agent's leads) with an optional agentId
// filter to view one agent's CRM at a time, plus a reassign action.
export function useAdminCrmViewModel(filters: LeadListFilters) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'leads', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => leadsRepository.list(filters),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] });

  const updateStatus = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: LeadStatus }) => leadsRepository.updateStatus({ leadId, status }),
    onMutate: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Lead[]>(queryKey);
      queryClient.setQueryData<Lead[]>(queryKey, (leads = []) =>
        leads.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)),
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

  return {
    leads: query.data ?? [],
    isLoading: query.isLoading,
    updateStatus,
    addNote,
    assign,
  };
}
