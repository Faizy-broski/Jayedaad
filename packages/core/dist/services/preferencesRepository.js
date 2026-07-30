import { httpClient } from './httpClient';
// Mirrors services/api/src/preferences — self-scoped via the caller's own
// JWT (no id param, unlike agentsRepository), any authenticated role.
export const preferencesRepository = {
    get: async () => {
        const { data } = await httpClient.get('/preferences');
        return data;
    },
    update: async (input) => {
        const { data } = await httpClient.patch('/preferences', input);
        return data;
    },
};
