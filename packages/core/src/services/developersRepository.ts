import { httpClient } from './httpClient';
import { CreateDeveloperInput, Developer, UpdateDeveloperInput } from '../models';

// services/api/src/developers/developers.repository.ts returns raw
// snake_case rows — mapped here to match Developer's camelCase shape.
function mapDeveloperRow(row: any): Developer {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    description: row.description,
    phone: row.phone,
    whatsapp: row.whatsapp,
    city: row.city,
  };
}

export const developersRepository = {
  list: async (filters: { city?: string } = {}): Promise<Developer[]> => {
    const { data } = await httpClient.get('/developers', { params: filters });
    return (data as any[]).map(mapDeveloperRow);
  },

  findBySlug: async (slug: string): Promise<Developer> => {
    const { data } = await httpClient.get(`/developers/${slug}`);
    return mapDeveloperRow(data);
  },

  // Super Admin-only.
  create: async (input: CreateDeveloperInput): Promise<Developer> => {
    const { data } = await httpClient.post('/developers', input);
    return mapDeveloperRow(data);
  },

  update: async (id: string, input: UpdateDeveloperInput): Promise<Developer> => {
    const { data } = await httpClient.patch(`/developers/${id}`, input);
    return mapDeveloperRow(data);
  },

  remove: async (id: string): Promise<{ id: string }> => {
    const { data } = await httpClient.delete(`/developers/${id}`);
    return data;
  },
};
