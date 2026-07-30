import { httpClient } from './httpClient';
import { AdminUser, CreateUserInput, ListUsersFilters, UpdateUserRoleInput } from '../models';

// services/api/src/users/users.repository.ts returns raw `profiles` rows
// (no server-side mapper) — mapped here to match AdminUser's camelCase shape.
function mapUserRow(row: any): AdminUser {
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
  list: async (filters: ListUsersFilters = {}): Promise<AdminUser[]> => {
    const { data } = await httpClient.get('/users', { params: { role: filters.roles?.join(',') } });
    return (data as any[]).map(mapUserRow);
  },

  findById: async (id: string): Promise<AdminUser> => {
    const { data } = await httpClient.get(`/users/${id}`);
    return mapUserRow(data);
  },

  create: async (input: CreateUserInput): Promise<AdminUser> => {
    const { data } = await httpClient.post('/users', input);
    return mapUserRow(data);
  },

  updateRole: async (id: string, input: UpdateUserRoleInput): Promise<void> => {
    await httpClient.patch(`/users/${id}/role`, input);
  },

  suspend: async (id: string): Promise<void> => {
    await httpClient.patch(`/users/${id}/suspend`);
  },

  unsuspend: async (id: string): Promise<void> => {
    await httpClient.patch(`/users/${id}/unsuspend`);
  },

  remove: async (id: string): Promise<void> => {
    await httpClient.delete(`/users/${id}`);
  },
};
