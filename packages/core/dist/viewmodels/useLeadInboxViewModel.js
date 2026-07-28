import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsRepository } from '../services/leadsRepository';
// Drives the CRM inquiry inbox. Optimistic status updates here are what
// satisfy [Dev Instr §1] "minimize clicks... feels instant" for the
// highest-frequency CRM action.
export function useLeadInboxViewModel(filters) {
    const queryClient = useQueryClient();
    const queryKey = ['leads', filters];
    const query = useQuery({
        queryKey,
        queryFn: () => leadsRepository.list(filters),
    });
    const updateStatus = useMutation({
        mutationFn: leadsRepository.updateStatus,
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
        onSettled: () => queryClient.invalidateQueries({ queryKey }),
    });
    const addNote = useMutation({
        mutationFn: ({ leadId, body }) => leadsRepository.addNote(leadId, body),
        onSettled: () => queryClient.invalidateQueries({ queryKey }),
    });
    return {
        leads: query.data ?? [],
        isLoading: query.isLoading,
        updateStatus,
        addNote,
    };
}
