import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { activityRepository, LogActivityInput } from '../services/activityRepository';
import { ActivityLogEntry } from '../models';

// Drives ActivityTimeline + the "Log Activity" action on both a lead's and
// an opportunity's detail surface (web crm/page.tsx's detail panel, mobile
// LeadDetailScreen.tsx/OpportunityDetailScreen.tsx). Exactly one of
// leadId/opportunityId is expected per instance — same convention as the
// backend's GET /crm/activity.
export function useActivityTimelineViewModel({ leadId, opportunityId }: { leadId?: string; opportunityId?: string }) {
  const queryClient = useQueryClient();
  const queryKey = leadId ? ['activity', 'lead', leadId] : ['activity', 'opportunity', opportunityId];

  const query = useQuery({
    queryKey,
    queryFn: () => (leadId ? activityRepository.listForLead(leadId) : activityRepository.listForOpportunity(opportunityId!)),
    enabled: !!(leadId || opportunityId),
  });

  const logActivity = useMutation({
    mutationFn: (input: Omit<LogActivityInput, 'leadId' | 'opportunityId'>) =>
      activityRepository.log({ ...input, leadId, opportunityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // A logged call/email/whatsapp/meeting also appears in the parent's
      // own lead_activity/opportunity_activity pointer list — invalidate
      // the detail queries that embed those too.
      if (leadId) queryClient.invalidateQueries({ queryKey: ['leads', 'detail', leadId] });
      if (opportunityId) queryClient.invalidateQueries({ queryKey: ['opportunities', 'detail', opportunityId] });
    },
  });

  return {
    activity: query.data ?? ([] as ActivityLogEntry[]),
    isLoading: query.isLoading,
    isError: query.isError,
    logActivity,
  };
}
