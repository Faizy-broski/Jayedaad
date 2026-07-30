import { httpClient } from './httpClient';
// services/api/src/developers/developers.repository.ts returns raw
// snake_case rows — mapped here to match Developer's camelCase shape.
function mapDeveloperRow(row) {
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
    list: async (filters = {}) => {
        const { data } = await httpClient.get('/developers', { params: filters });
        return data.map(mapDeveloperRow);
    },
    findBySlug: async (slug) => {
        const { data } = await httpClient.get(`/developers/${slug}`);
        return mapDeveloperRow(data);
    },
    // Super Admin-only.
    create: async (input) => {
        const { data } = await httpClient.post('/developers', input);
        return mapDeveloperRow(data);
    },
    update: async (id, input) => {
        const { data } = await httpClient.patch(`/developers/${id}`, input);
        return mapDeveloperRow(data);
    },
    remove: async (id) => {
        const { data } = await httpClient.delete(`/developers/${id}`);
        return data;
    },
};
