import { httpClient } from './httpClient';
import { mapAgencyRow } from './agenciesRepository';
import { Agency, AgentOverview, PlatformStats, RevenueStats, RevenueSummary, RoleAccessDescription } from '../models';

export interface AdminPageFilters {
  page?: number;
  pageSize?: number;
}

export interface AdminAgentsFilters extends AdminPageFilters {
  search?: string;
  verificationStatus?: string;
  reviewableOnly?: boolean;
}

export interface PaginatedAgentsOverview {
  items: AgentOverview[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminPaginatedAgencies {
  items: Agency[];
  total: number;
  page: number;
  pageSize: number;
}

// services/api/src/admin/admin.repository.ts already maps every response to
// camelCase (no snake_case mapping needed here, unlike agenciesRepository/
// usersRepository) — except listAgenciesOverview, which returns the same
// raw snake_case agency rows as GET /agencies and reuses agenciesRepository's
// mapper for that one.
export const adminRepository = {
  getPlatformStats: async (): Promise<PlatformStats> => {
    const { data } = await httpClient.get('/admin/stats');
    return data;
  },

  // Real payments-ledger figures (see revenue.repository.ts) — already
  // camelCase off the backend, no mapping needed here.
  getRevenueStats: async (): Promise<RevenueStats> => {
    const { data } = await httpClient.get('/admin/revenue');
    return data;
  },

  // Dual-mode, mirroring the backend: called with no page/pageSize, resolves
  // to AgentOverview[] (CRM's unbounded "All agents"/"Reassign to…"
  // dropdowns); called with either, resolves to a Page shape (the Agents
  // admin table). Two possible return shapes off one endpoint — see
  // admin.repository.ts::listAgentsOverview's comment for why.
  listAgentsOverview: async (filters: AdminAgentsFilters = {}): Promise<AgentOverview[] | PaginatedAgentsOverview> => {
    const { data } = await httpClient.get('/admin/agents', { params: filters });
    return data;
  },

  // Admin-scoped agency roster — every verification status, unlike
  // agenciesRepository.list() (GET /agencies, @Public()) which only ever
  // returns verified agencies for the buyer-facing directory. Dual-mode,
  // same convention as listAgentsOverview above: called with no
  // page/pageSize (the CRM agent/agency picker's unbounded "every agency"
  // list), resolves to Agency[]; called with either (the Agencies admin
  // table), resolves to a Page shape.
  listAgenciesOverview: async (
    filters: AdminPageFilters & { search?: string; verificationStatus?: string } = {},
  ): Promise<Agency[] | AdminPaginatedAgencies> => {
    const { data } = await httpClient.get('/admin/agencies', { params: filters });
    if (Array.isArray(data)) return (data as any[]).map(mapAgencyRow);
    return { ...data, items: (data.items as any[]).map(mapAgencyRow) };
  },

  // One agency's commission revenue, aggregated across every one of its
  // staff members directly by agency_id — no anchor agentId needed, unlike
  // agentsRepository.getRevenue's scope='agency' (which needs a known
  // staff member's id). Already camelCase off the backend.
  getAgencyRevenue: async (agencyId: string, params: { period: 'month' | 'quarter' | 'year' }): Promise<RevenueSummary> => {
    const { data } = await httpClient.get(`/admin/agencies/${agencyId}/revenue`, { params });
    return data;
  },

  listRoles: async (): Promise<RoleAccessDescription[]> => {
    const { data } = await httpClient.get('/admin/roles');
    return data;
  },
};
