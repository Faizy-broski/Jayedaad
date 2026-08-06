import { httpClient } from './httpClient';
import {
  CreateProjectInput,
  PaginatedProjects,
  Project,
  ProjectCategoryCount,
  ProjectCityCount,
  ProjectSearchFilters,
  ProjectStatus,
  SetProjectVerificationStatusInput,
  UpdateProjectInput,
} from '../models';

export const projectsRepository = {
  searchPublic: async (filters: ProjectSearchFilters = {}): Promise<PaginatedProjects> => {
    const { data } = await httpClient.get('/projects', { params: filters });
    return data;
  },

  // Agent/Super Admin "manage" list — every project regardless of
  // verification_status, unlike searchPublic above (verified-only). Backs
  // both /admin/projects and the agent-portal /projects list.
  listAll: async (
    filters: { city?: string; status?: ProjectStatus; keyword?: string; page?: number; pageSize?: number } = {},
  ): Promise<PaginatedProjects> => {
    const { data } = await httpClient.get('/projects/manage', { params: filters });
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

  // Agent/Super Admin detail fetch by id — backs the edit/view pages.
  findById: async (id: string): Promise<Project> => {
    const { data } = await httpClient.get(`/projects/id/${id}`);
    return data;
  },

  create: async (input: CreateProjectInput): Promise<Project> => {
    const { data } = await httpClient.post('/projects', input);
    return data;
  },

  update: async (id: string, input: UpdateProjectInput): Promise<Project> => {
    const { data } = await httpClient.patch(`/projects/${id}`, input);
    return data;
  },

  remove: async (id: string): Promise<{ id: string }> => {
    const { data } = await httpClient.delete(`/projects/${id}`);
    return data;
  },

  uploadMedia: async (file: any): Promise<{ url: string; type: 'image' | 'video' | 'document' }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post('/projects/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  setVerificationStatus: async (id: string, input: SetProjectVerificationStatusInput): Promise<Project> => {
    const { data } = await httpClient.patch(`/projects/${id}/verification`, input);
    return data;
  },
};
