import { httpClient } from './httpClient';
import {
  Lead,
  LeadActivityEntry,
  LeadInquirerType,
  LeadListResult,
  LeadNote,
  LeadSource,
  LeadStatus,
  LeadStatusHistoryEntry,
} from '../models';

export interface LeadListFilters {
  status?: LeadStatus;
  listingId?: string;
  // Super Admin-only — filters the otherwise-unscoped cross-agent result set
  // GET /crm/leads returns for super_admin down to one agent at a time.
  agentId?: string;
  // Agency Admin-only (Document Verification Phase 3) — widens the result
  // set to every associate's leads in the caller's agency. Ignored for a
  // non-admin agent or super_admin.
  scope?: 'own' | 'agency';
  // Super Admin-only — filters down to leads with no assigned agent.
  unassigned?: boolean;
  // Matches against name/phone/email server-side — searches across every
  // page, not just whatever page is currently loaded.
  search?: string;
  page?: number;
  pageSize?: number;
}

// Mirrors services/api/src/leads/dto/create-lead.dto.ts — the public
// "Contact Agent" intake, verified against a real Zameen.com form. Exactly
// one of listingId/projectId — the API 400s otherwise (see
// LeadsRepository.create()'s XOR check).
export interface CreateLeadInput {
  listingId?: string;
  projectId?: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  source: LeadSource;
  inquirerType?: LeadInquirerType;
  wantsSimilarAlerts?: boolean;
  // Set for the "Book a Visit" action (vs. plain "Send Enquiry") — also
  // creates a linked 'requested' appointment on the agent's calendar.
  isVisitRequest?: boolean;
}

// services/api/src/leads/leads.repository.ts returns raw snake_case Supabase
// rows (no server-side mapper, same convention as agenciesRepository.ts) —
// mapped here to match Lead's camelCase shape. Previously this file had NO
// mapping at all (list()/create() just cast the raw response straight to
// Lead), which meant every camelCase field read anywhere in the UI
// (lead.listingId, lead.agentId, ...) was silently undefined.
function mapNoteRow(row: any): LeadNote {
  return { id: row.id, leadId: row.lead_id, authorId: row.author_id, body: row.body, createdAt: row.created_at };
}

function mapStatusHistoryRow(row: any): LeadStatusHistoryEntry {
  return {
    id: row.id,
    leadId: row.lead_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  };
}

function mapActivityRow(row: any): LeadActivityEntry {
  return { id: row.id, leadId: row.lead_id, type: row.type, refId: row.ref_id, createdAt: row.created_at };
}

function mapLeadRow(row: any): Lead {
  return {
    id: row.id,
    listingId: row.listing_id,
    projectId: row.project_id,
    agentId: row.agent_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    inquirerType: row.inquirer_type,
    wantsSimilarAlerts: row.wants_similar_alerts,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    notes: (row.lead_notes ?? []).map(mapNoteRow),
    statusHistory: (row.lead_status_history ?? []).map(mapStatusHistoryRow),
    activity: (row.lead_activity ?? []).map(mapActivityRow),
  };
}

export const leadsRepository = {
  list: async (filters: LeadListFilters): Promise<LeadListResult> => {
    const { data } = await httpClient.get('/crm/leads', { params: filters });
    return { items: (data.items ?? []).map(mapLeadRow), total: data.total, page: data.page, pageSize: data.pageSize };
  },

  create: async (input: CreateLeadInput): Promise<Lead> => {
    const { data } = await httpClient.post('/crm/leads', input);
    return mapLeadRow(data);
  },

  findById: async (leadId: string): Promise<Lead> => {
    const { data } = await httpClient.get(`/crm/leads/${leadId}`);
    return mapLeadRow(data);
  },

  addNote: async (leadId: string, body: string) => {
    await httpClient.post(`/crm/leads/${leadId}/notes`, { body });
  },

  updateStatus: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
    await httpClient.patch(`/crm/leads/${leadId}/status`, { status });
  },

  // Super Admin-only — reassigns a lead to a different agent.
  assign: async (leadId: string, agentId: string): Promise<void> => {
    await httpClient.patch(`/crm/leads/${leadId}/assign`, { agentId });
  },

  // Super Admin-only — hard delete.
  remove: async (leadId: string): Promise<{ id: string }> => {
    const { data } = await httpClient.delete(`/crm/leads/${leadId}`);
    return data;
  },
};
