import { httpClient } from './httpClient';
// services/api/src/users/users.repository.ts returns raw `profiles` rows
// (no server-side mapper) — mapped here to match AdminUser's camelCase shape.
function mapUserRow(row) {
    return {
        id: row.id,
        role: row.role,
        agentId: row.agent_id,
        email: row.email,
        displayName: row.display_name,
        createdAt: row.created_at,
    };
}
export const usersRepository = {
    list: async (filters = {}) => {
        const { data } = await httpClient.get('/users', { params: { role: filters.roles?.join(',') } });
        return data.map(mapUserRow);
    },
    findById: async (id) => {
        const { data } = await httpClient.get(`/users/${id}`);
        return mapUserRow(data);
    },
    create: async (input) => {
        const { data } = await httpClient.post('/users', input);
        return mapUserRow(data);
    },
    updateRole: async (id, input) => {
        await httpClient.patch(`/users/${id}/role`, input);
    },
    suspend: async (id) => {
        await httpClient.patch(`/users/${id}/suspend`);
    },
    unsuspend: async (id) => {
        await httpClient.patch(`/users/${id}/unsuspend`);
    },
    remove: async (id) => {
        await httpClient.delete(`/users/${id}`);
    },
};
