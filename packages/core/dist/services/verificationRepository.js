import { httpClient } from './httpClient';
export const verificationRepository = {
    queue: async () => {
        const { data } = await httpClient.get('/verification/queue');
        return data;
    },
    act: async ({ listingId, action, note }) => {
        const { data } = await httpClient.post(`/verification/${listingId}/${action}`, { note });
        return data;
    },
};
