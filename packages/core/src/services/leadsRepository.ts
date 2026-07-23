import { httpClient } from './httpClient';
import { Lead, LeadInquirerType, LeadSource, LeadStatus } from '../models';

export interface LeadListFilters {
  status?: LeadStatus;
  listingId?: string;
}

// Mirrors services/api/src/leads/dto/create-lead.dto.ts — the public
// "Contact Agent" intake, verified against a real Zameen.com form.
export interface CreateLeadInput {
  listingId: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  source: LeadSource;
  inquirerType?: LeadInquirerType;
  wantsSimilarAlerts?: boolean;
}

export const leadsRepository = {
  list: async (filters: LeadListFilters): Promise<Lead[]> => {
    const { data } = await httpClient.get('/crm/leads', { params: filters });
    return data;
  },

  create: async (input: CreateLeadInput): Promise<Lead> => {
    const { data } = await httpClient.post('/crm/leads', input);
    return data;
  },

  addNote: async (leadId: string, body: string) => {
    const { data } = await httpClient.post(`/crm/leads/${leadId}/notes`, { body });
    return data;
  },

  updateStatus: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
    const { data } = await httpClient.patch(`/crm/leads/${leadId}/status`, { status });
    return data;
  },
};
