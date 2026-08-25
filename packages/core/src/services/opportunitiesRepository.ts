import { httpClient } from './httpClient';
import { DealType, Opportunity, OpportunityFunnelStats, OpportunityListResult, OpportunityStage, OpportunityStageHistoryEntry } from '../models';

export interface OpportunityListFilters {
  stage?: OpportunityStage;
  // Super Admin-only — filters the otherwise cross-agent result set down to
  // one agent, same convention as LeadListFilters.agentId.
  agentId?: string;
  // Agency Admin-only — widens the result set to every associate's
  // opportunities in the caller's agency, same convention as
  // LeadListFilters.scope.
  scope?: 'own' | 'agency';
  listingId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateOpportunityInput {
  name: string;
  value: number;
  expectedCloseDate: string;
  listingId?: string;
  projectId?: string;
  dealType?: DealType;
}

export interface ConvertLeadInput {
  name: string;
  value: number;
  expectedCloseDate: string;
  dealType?: DealType;
}

export interface UpdateOpportunityStageInput {
  toStage: OpportunityStage;
  lostReason?: string;
}

export interface UpdateOpportunityInput {
  value?: number;
  expectedCloseDate?: string;
  probability?: number;
}

export interface OpportunityFunnelFilters {
  scope?: 'own' | 'agency';
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// services/api/src/opportunities/opportunities.repository.ts returns raw
// snake_case Supabase rows (no server-side mapper, same convention as
// leadsRepository.ts) — mapped here to match Opportunity's camelCase shape.
function mapStageHistoryRow(row: any): OpportunityStageHistoryEntry {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  };
}

export function mapOpportunityRow(row: any): Opportunity {
  return {
    id: row.id,
    leadId: row.lead_id,
    listingId: row.listing_id,
    projectId: row.project_id,
    agentId: row.agent_id,
    agencyId: row.agency_id,
    dealType: row.deal_type,
    name: row.name,
    value: Number(row.value),
    stage: row.stage,
    probability: Number(row.probability),
    expectedCloseDate: row.expected_close_date,
    lostReason: row.lost_reason,
    dealId: row.deal_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stageHistory: (row.opportunity_stage_history ?? []).map(mapStageHistoryRow),
  };
}

export const opportunitiesRepository = {
  list: async (filters: OpportunityListFilters = {}): Promise<OpportunityListResult> => {
    const { data } = await httpClient.get('/crm/opportunities', { params: filters });
    return { items: (data.items ?? []).map(mapOpportunityRow), total: data.total, page: data.page, pageSize: data.pageSize };
  },

  findById: async (id: string): Promise<Opportunity> => {
    const { data } = await httpClient.get(`/crm/opportunities/${id}`);
    return mapOpportunityRow(data);
  },

  // Direct-creation path — no source lead. See ConvertLeadInput /
  // leadsRepository.convertToOpportunity for the promote-from-lead path.
  create: async (input: CreateOpportunityInput): Promise<Opportunity> => {
    const { data } = await httpClient.post('/crm/opportunities', input);
    return mapOpportunityRow(data);
  },

  updateStage: async (id: string, input: UpdateOpportunityStageInput): Promise<Opportunity> => {
    const { data } = await httpClient.patch(`/crm/opportunities/${id}/stage`, input);
    return mapOpportunityRow(data);
  },

  update: async (id: string, input: UpdateOpportunityInput): Promise<Opportunity> => {
    const { data } = await httpClient.patch(`/crm/opportunities/${id}`, input);
    return mapOpportunityRow(data);
  },

  // Already camelCase off the backend (no server-side snake_case mapper
  // needed for this one — the repository builds the response object
  // directly in camelCase), so no row-mapping here.
  getFunnel: async (filters: OpportunityFunnelFilters = {}): Promise<OpportunityFunnelStats> => {
    const { data } = await httpClient.get('/crm/opportunities/funnel', { params: filters });
    return data;
  },
};
