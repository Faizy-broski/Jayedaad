import { httpClient } from './httpClient';
export const listingsRepository = {
    searchPublic: async (filters) => {
        const { data } = await httpClient.get('/listings', { params: filters });
        return data;
    },
    // Role-aware on the API side: owners see what they submitted, agents see
    // what they're assigned to (the real Profolio "My Listings" page).
    findMine: async (filters = {}) => {
        const { data } = await httpClient.get('/listings/mine', { params: filters });
        return data;
    },
    // Backs the status tab badges ("Active (0)", "Pending (0)", etc.).
    getMyStatusCounts: async () => {
        const { data } = await httpClient.get('/listings/mine/status-counts');
        return data;
    },
    // The property detail page itself — confirmed real via a scraped Zameen
    // listing detail page.
    findById: async (listingId) => {
        const { data } = await httpClient.get(`/listings/${listingId}`);
        return data;
    },
    findSimilar: async (listingId) => {
        const { data } = await httpClient.get(`/listings/${listingId}/similar`);
        return data;
    },
    listCities: async () => {
        const { data } = await httpClient.get('/listings/locations/cities');
        return data;
    },
    listAreas: async (city) => {
        const { data } = await httpClient.get('/listings/locations/areas', { params: { city } });
        return data;
    },
    create: async (input) => {
        const { data } = await httpClient.post('/listings', input);
        return data;
    },
    // Real property-verification requirement — ID card front/back, ownership
    // proof, last utility bill. `file` is platform-specific (a browser File on
    // web, a { uri, name, type } asset object on React Native), left untyped
    // here since packages/core stays framework-agnostic.
    uploadDocument: async (listingId, documentType, file) => {
        const formData = new FormData();
        formData.append('documentType', documentType);
        formData.append('file', file);
        const { data } = await httpClient.post(`/listings/${listingId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    listDocuments: async (listingId) => {
        const { data } = await httpClient.get(`/listings/${listingId}/documents`);
        return data;
    },
};
