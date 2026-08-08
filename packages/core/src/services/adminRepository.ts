import { httpClient } from './httpClient';
import { mapAgencyRow } from './agenciesRepository';
import { Agency, AgentOverview, PlatformStats, RoleAccessDescription } from '../models';

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

export interface PaginatedAgencies {
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
  // returns verified agencies for the buyer-facing directory. See
  // admin.repository.ts::listAgenciesOverview for why the Super Admin
  // Agencies page needs this instead. Always paginated (no other consumer
  // needs the unbounded shape).
  listAgenciesOverview: async (
    filters: AdminPageFilters & { search?: string; verificationStatus?: string } = {},
  ): Promise<PaginatedAgencies> => {
    const { data } = await httpClient.get('/admin/agencies', { params: filters });
    return { ...data, items: (data.items as any[]).map(mapAgencyRow) };
  },

  listRoles: async (): Promise<RoleAccessDescription[]> => {
    const { data } = await httpClient.get('/admin/roles');
    return data;
  },
};
