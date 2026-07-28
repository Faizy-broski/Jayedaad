import { httpClient } from './httpClient';
export const leadsRepository = {
    list: async (filters) => {
        const { data } = await httpClient.get('/crm/leads', { params: filters });
        return data;
    },
    create: async (input) => {
        const { data } = await httpClient.post('/crm/leads', input);
        return data;
    },
    addNote: async (leadId, body) => {
        const { data } = await httpClient.post(`/crm/leads/${leadId}/notes`, { body });
        return data;
    },
    updateStatus: async ({ leadId, status }) => {
        const { data } = await httpClient.patch(`/crm/leads/${leadId}/status`, { status });
        return data;
    },
};
