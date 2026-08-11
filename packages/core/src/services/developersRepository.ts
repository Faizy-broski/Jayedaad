import { httpClient } from './httpClient';
import { CreateDeveloperInput, Developer, UpdateDeveloperInput } from '../models';

export interface ListDevelopersFilters {
  city?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedDevelopers {
  items: Developer[];
  total: number;
  page: number;
  pageSize: number;
}

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
    email: row.email,
  };
}

export const developersRepository = {
  // Dual-mode, mirroring the backend: called with no page/pageSize,
  // resolves to Developer[] (ProjectForm's/ProjectsFilters'/
  // PropertySearchBar's unbounded developer dropdowns); called with either,
  // resolves to a Page shape (the Developers admin table). See
  // developers.repository.ts::list's comment for why.
  list: async (filters: ListDevelopersFilters = {}): Promise<Developer[] | PaginatedDevelopers> => {
    const { data } = await httpClient.get('/developers', { params: filters });
    if (Array.isArray(data)) return (data as any[]).map(mapDeveloperRow);
    return { ...data, items: (data.items as any[]).map(mapDeveloperRow) };
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
