import { httpClient } from './httpClient';
import { CreateReminderInput, Reminder } from '../models';

// services/api/src/reminders/reminders.repository.ts returns raw
// snake_case Supabase rows — mapped here, same convention as the rest of
// this file's siblings (leadsRepository.ts, agenciesRepository.ts).
function mapReminderRow(row: any): Reminder {
  return {
    id: row.id,
    leadId: row.lead_id,
    remindAt: row.remind_at,
    channel: row.channel,
    firedAt: row.fired_at,
  };
}

export const remindersRepository = {
  listForLead: async (leadId: string): Promise<Reminder[]> => {
    const { data } = await httpClient.get(`/crm/leads/${leadId}/reminders`);
    return (data ?? []).map(mapReminderRow);
  },

  create: async (leadId: string, input: CreateReminderInput): Promise<Reminder> => {
    const { data } = await httpClient.post(`/crm/leads/${leadId}/reminders`, input);
    return mapReminderRow(data);
  },

  remove: async (id: string): Promise<{ id: string }> => {
    const { data } = await httpClient.delete(`/reminders/${id}`);
    return data;
  },
};
