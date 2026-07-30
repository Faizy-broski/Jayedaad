import { httpClient } from './httpClient';
// Backs the Profolio-style agent Dashboard (stats/credits/analytics cards)
// and the "User Settings" tab of the Settings page.
// Mirrors services/api/src/agents/agents.controller.ts's endpoints — see
// packages/core/src/models/index.ts for the exact response shapes.
export const agentsRepository = {
    getStats: async (agentId) => {
        const { data } = await httpClient.get(`/agents/${agentId}/stats`);
        return data;
    },
    getCredits: async (agentId) => {
        const { data } = await httpClient.get(`/agents/${agentId}/credits`);
        return data;
    },
    getAnalytics: async (agentId, filters = {}) => {
        const { data } = await httpClient.get(`/agents/${agentId}/analytics`, { params: filters });
        return data;
    },
    getProfile: async (agentId) => {
        const { data } = await httpClient.get(`/agents/${agentId}`);
        return data;
    },
    updateProfile: async (agentId, input) => {
        const { data } = await httpClient.patch(`/agents/${agentId}`, input);
        return data;
    },
    // `file` is platform-specific (a browser File on web, a { uri, name, type }
    // asset object on React Native) — same untyped convention as
    // listingsRepository.uploadDocument/uploadListingMedia.
    uploadPhoto: async (agentId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await httpClient.post(`/agents/${agentId}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    // Super Admin-only — the write-side counterpart to getCredits above.
    grantCredits: async (agentId, input) => {
        const { data } = await httpClient.patch(`/agents/${agentId}/credits`, input);
        return data;
    },
    setVerificationStatus: async (agentId, status) => {
        const { data } = await httpClient.patch(`/agents/${agentId}/verify`, { status });
        return data;
    },
};
