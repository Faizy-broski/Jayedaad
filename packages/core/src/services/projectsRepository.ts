import { httpClient } from './httpClient';
import { CreateProjectInput, PaginatedProjects, Project, ProjectCategoryCount, ProjectCityCount, ProjectSearchFilters } from '../models';

export const projectsRepository = {
  searchPublic: async (filters: ProjectSearchFilters = {}): Promise<PaginatedProjects> => {
    const { data } = await httpClient.get('/projects', { params: filters });
    return data;
  },

  // Backs "Browse Projects by City".
  listCities: async (): Promise<ProjectCityCount[]> => {
    const { data } = await httpClient.get('/projects/cities');
    return data;
  },

  // Backs "Browse Projects by Category".
  listCategories: async (): Promise<ProjectCategoryCount[]> => {
    const { data } = await httpClient.get('/projects/categories');
    return data;
  },

  findBySlug: async (slug: string): Promise<Project> => {
    const { data } = await httpClient.get(`/projects/${slug}`);
    return data;
  },

  create: async (input: CreateProjectInput): Promise<Project> => {
    const { data } = await httpClient.post('/projects', input);
    return data;
  },
};
