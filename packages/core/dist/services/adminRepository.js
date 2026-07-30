import { httpClient } from './httpClient';
// services/api/src/admin/admin.repository.ts already maps every response to
// camelCase (no snake_case mapping needed here, unlike agenciesRepository/
// usersRepository).
export const adminRepository = {
    getPlatformStats: async () => {
        const { data } = await httpClient.get('/admin/stats');
        return data;
    },
    listAgentsOverview: async () => {
        const { data } = await httpClient.get('/admin/agents');
        return data;
    },
    listRoles: async () => {
        const { data } = await httpClient.get('/admin/roles');
        return data;
    },
};
