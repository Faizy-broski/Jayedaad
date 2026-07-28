import { httpClient } from './httpClient';
export const projectsRepository = {
    searchPublic: async (filters = {}) => {
        const { data } = await httpClient.get('/projects', { params: filters });
        return data;
    },
    // Backs "Browse Projects by City".
    listCities: async () => {
        const { data } = await httpClient.get('/projects/cities');
        return data;
    },
    // Backs "Browse Projects by Category".
    listCategories: async () => {
        const { data } = await httpClient.get('/projects/categories');
        return data;
    },
    findBySlug: async (slug) => {
        const { data } = await httpClient.get(`/projects/${slug}`);
        return data;
    },
    create: async (input) => {
        const { data } = await httpClient.post('/projects', input);
        return data;
    },
};
