import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsRepository } from '../services/leadsRepository';
// Super Admin cross-agent CRM — same GET /crm/leads endpoint the agent
// Inbox uses, but unscoped (every agent's leads) with an optional agentId
// filter to view one agent's CRM at a time, plus a reassign action.
export function useAdminCrmViewModel(filters) {
    const queryClient = useQueryClient();
    const queryKey = ['admin', 'leads', filters];
    const query = useQuery({
        queryKey,
        queryFn: () => leadsRepository.list(filters),
    });
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] });
    const updateStatus = useMutation({
        mutationFn: ({ leadId, status }) => leadsRepository.updateStatus({ leadId, status }),
        onMutate: async ({ leadId, status }) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, (leads = []) => leads.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous)
                queryClient.setQueryData(queryKey, context.previous);
        },
        onSettled: invalidate,
    });
    const addNote = useMutation({
        mutationFn: ({ leadId, body }) => leadsRepository.addNote(leadId, body),
        onSettled: invalidate,
    });
    const assign = useMutation({
        mutationFn: ({ leadId, agentId }) => leadsRepository.assign(leadId, agentId),
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
