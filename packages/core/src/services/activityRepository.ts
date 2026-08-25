import { httpClient } from './httpClient';
import { ActivityLogEntry } from '../models';

// Loggable subset of LeadActivityType — 'note'/'status_change'/'assignment'/
// 'opportunity_converted' are system-generated (never logged through this
// endpoint), only these four are ever agent-initiated.
export type LoggableActivityType = 'call' | 'email' | 'whatsapp' | 'meeting';

export interface LogActivityInput {
  leadId?: string;
  opportunityId?: string;
  type: LoggableActivityType;
  occurredAt?: string;
  summary: string;
  outcome?: string;
}

// services/api/src/activity/activity.repository.ts returns raw snake_case
// Supabase rows (no server-side mapper, same convention as leadsRepository.ts).
function mapActivityLogEntryRow(row: any): ActivityLogEntry {
  return {
    id: row.id,
    leadId: row.lead_id,
    opportunityId: row.opportunity_id,
    type: row.type,
    loggedBy: row.logged_by,
    occurredAt: row.occurred_at,
    summary: row.summary,
    outcome: row.outcome,
    createdAt: row.created_at,
  };
}

export const activityRepository = {
  log: async (input: LogActivityInput): Promise<ActivityLogEntry> => {
    const { data } = await httpClient.post('/crm/activity', input);
    return mapActivityLogEntryRow(data);
  },

  listForLead: async (leadId: string): Promise<ActivityLogEntry[]> => {
    const { data } = await httpClient.get('/crm/activity', { params: { leadId } });
    return (data as any[]).map(mapActivityLogEntryRow);
  },

  listForOpportunity: async (opportunityId: string): Promise<ActivityLogEntry[]> => {
    const { data } = await httpClient.get('/crm/activity', { params: { opportunityId } });
    return (data as any[]).map(mapActivityLogEntryRow);
  },
};
