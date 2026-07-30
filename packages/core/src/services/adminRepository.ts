import { httpClient } from './httpClient';
import { AgentOverview, PlatformStats, RoleAccessDescription } from '../models';

// services/api/src/admin/admin.repository.ts already maps every response to
// camelCase (no snake_case mapping needed here, unlike agenciesRepository/
// usersRepository).
export const adminRepository = {
  getPlatformStats: async (): Promise<PlatformStats> => {
    const { data } = await httpClient.get('/admin/stats');
    return data;
  },

  listAgentsOverview: async (): Promise<AgentOverview[]> => {
    const { data } = await httpClient.get('/admin/agents');
    return data;
  },

  listRoles: async (): Promise<RoleAccessDescription[]> => {
    const { data } = await httpClient.get('/admin/roles');
    return data;
  },
};
