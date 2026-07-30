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
    // Backs the agent dashboard's Calls/WhatsApp/SMS analytics — public,
    // fire-and-forget from the caller (a failed track shouldn't block the
    // real tel:/wa.me/sms: action). Mirrors services/api's TrackEngagementDto
    // exactly; 'view'/'email' are deliberately not exposed here — no
    // listing-detail page or listing-level email exists yet for either to
    // attach to honestly.
    trackEngagement: async (listingId, input) => {
        await httpClient.post(`/listings/${listingId}/track`, input);
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
    // Same body/validation as create() — saved with status='draft' instead of
    // entering the verification queue. Pair with submitDraft() once the
    // agent/owner is ready to send it for review.
    createDraft: async (input) => {
        const { data } = await httpClient.post('/listings/draft', input);
        return data;
    },
    submitDraft: async (listingId) => {
        const { data } = await httpClient.post(`/listings/${listingId}/submit`);
        return data;
    },
    // Super Admin-only direct lifecycle override (expired/deleted/downgraded/
    // inactive, plus a staff-equivalent verified/rejected override) — distinct
    // from the verification queue's approve/reject/request-info action.
    setStatus: async (listingId, status) => {
        const { data } = await httpClient.patch(`/listings/${listingId}/status`, { status });
        return data;
    },
    // The write path Property Management's row actions were missing entirely
    // until now — self-scoped to the caller's own listing server-side (see
    // services/api/src/listings/listings.controller.ts::update).
    updateListing: async (listingId, input) => {
        const { data } = await httpClient.patch(`/listings/${listingId}`, input);
        return data;
    },
    // Soft delete — server-side sets status to 'deleted' (an existing
    // ListingStatus with its own My Listings tab), not a hard row delete.
    deleteListing: async (listingId) => {
        const { data } = await httpClient.delete(`/listings/${listingId}`);
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
    // Uploads a photo/video ahead of the listing existing — the submit form
    // uploads as files are picked, then passes the returned urls into
    // create()'s `media` array. `file` is platform-specific (a browser File
    // on web, a { uri, name, type } asset object on React Native).
    uploadListingMedia: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await httpClient.post('/listings/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
};
