import { httpClient } from './httpClient';
// services/api/src/agencies/agencies.repository.ts returns raw snake_case
// rows (no server-side mapper, unlike agents.repository.ts/listings.repository.ts)
// — mapped here to match Agency's camelCase shape.
function mapAgencyRow(row) {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        logoUrl: row.logo_url,
        description: row.description,
        phone: row.phone,
        email: row.email,
        city: row.city,
        address: row.address,
        businessHours: row.business_hours,
        verificationStatus: row.verification_status,
    };
}
export const agenciesRepository = {
    list: async (filters = {}) => {
        const { data } = await httpClient.get('/agencies', { params: filters });
        return data.map(mapAgencyRow);
    },
    findBySlug: async (slug) => {
        const { data } = await httpClient.get(`/agencies/${slug}`);
        return mapAgencyRow(data);
    },
    getStats: async (slug) => {
        const { data } = await httpClient.get(`/agencies/${slug}/stats`);
        return data;
    },
    create: async (input) => {
        const { data } = await httpClient.post('/agencies', input);
        return mapAgencyRow(data);
    },
    update: async (id, input) => {
        const { data } = await httpClient.patch(`/agencies/${id}`, input);
        return mapAgencyRow(data);
    },
    setVerificationStatus: async (id, input) => {
        const { data } = await httpClient.patch(`/agencies/${id}/verify`, input);
        return mapAgencyRow(data);
    },
    remove: async (id) => {
        const { data } = await httpClient.delete(`/agencies/${id}`);
        return data;
    },
    // `file` is platform-specific (a browser File on web) — same untyped
    // convention as listingsRepository.uploadDocument.
    uploadDocument: async (agencyId, documentType, file) => {
        const formData = new FormData();
        formData.append('documentType', documentType);
        formData.append('file', file);
        const { data } = await httpClient.post(`/agencies/${agencyId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    listDocuments: async (agencyId) => {
        const { data } = await httpClient.get(`/agencies/${agencyId}/documents`);
        return data;
    },
};
