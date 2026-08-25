import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ConvertLeadInput,
  CreateOpportunityInput,
  opportunitiesRepository,
  OpportunityListFilters,
  UpdateOpportunityInput,
  UpdateOpportunityStageInput,
} from '../services/opportunitiesRepository';
import { leadsRepository } from '../services/leadsRepository';
import { Opportunity, OpportunityListResult } from '../models';

// Drives the pipeline list/board. `enabled` (default true) lets a caller
// that only needs a mutation (e.g. ConvertToOpportunityModal, which used
// to fire a full, unused GET /crm/opportunities on every /crm page load
// just to get `convertLead`) skip the list query entirely — same
// `enabled`-option convention useUserManagementViewModel/
// useAgentProfileViewModel already use for the same reason.
export function useOpportunityPipelineViewModel(filters: OpportunityListFilters = {}, options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['opportunities', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => opportunitiesRepository.list(filters),
    enabled: options.enabled ?? true,
  });

  // Converting a lead touches both collections — the source lead's own
  // activity timeline changes too (a system-generated 'opportunity_converted'
  // entry), so both query families invalidate together.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const create = useMutation({
    mutationFn: (input: CreateOpportunityInput) => opportunitiesRepository.create(input),
    onSuccess: invalidate,
  });

  // "Convert to Opportunity" — promotes an existing lead. Lives here (not
  // useLeadInboxViewModel) since its result belongs to the opportunities
  // collection, even though its input is a leadId; the crm inbox page
  // calls both hooks side by side already.
  const convertLead = useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: ConvertLeadInput }) => leadsRepository.convertToOpportunity(leadId, input),
    onSuccess: invalidate,
  });

  // Real optimistic update — a drag-and-drop stage change previously only
  // moved a card after the full PATCH + refetch round trip resolved
  // (dnd-kit resets the drag transform immediately on drop, so without
  // this the card visibly snapped back to its old column and only jumped
  // to the new one a beat later, reading as "the drag did nothing" on any
  // non-instant connection). Mirrors useLeadInboxViewModel.updateStatus's
  // optimistic pattern exactly: cancel in-flight fetches for this exact
  // query, snapshot, write the moved card in immediately, roll back on
  // error, reconcile with the server via invalidate once settled.
  const updateStage = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOpportunityStageInput }) => opportunitiesRepository.updateStage(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<OpportunityListResult>(queryKey);
      queryClient.setQueryData<OpportunityListResult>(queryKey, (result) =>
        result
          ? {
              ...result,
              items: result.items.map((o) =>
                o.id === id ? { ...o, stage: input.toStage, lostReason: input.toStage === 'lost' ? (input.lostReason ?? null) : o.lostReason } : o,
              ),
            }
          : result,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOpportunityInput }) => opportunitiesRepository.update(id, input),
    onSuccess: invalidate,
  });

  return {
    opportunities: query.data?.items ?? ([] as Opportunity[]),
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    create,
    convertLead,
    updateStage,
    update,
  };
}

// Single-opportunity detail — same shape as useLeadDetailViewModel.
export function useOpportunityDetailViewModel(id: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['opportunities', 'detail', id];

  const query = useQuery({
    queryKey,
    queryFn: () => opportunitiesRepository.findById(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  };

  const updateStage = useMutation({
    mutationFn: (input: UpdateOpportunityStageInput) => opportunitiesRepository.updateStage(id!, input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: (input: UpdateOpportunityInput) => opportunitiesRepository.update(id!, input),
    onSuccess: invalidate,
  });

  return {
    opportunity: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    updateStage,
    update,
  };
}
