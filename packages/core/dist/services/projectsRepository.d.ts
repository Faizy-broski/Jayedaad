import { CreateProjectInput, PaginatedProjects, Project, ProjectCategoryCount, ProjectCityCount, ProjectSearchFilters } from '../models';
export declare const projectsRepository: {
    searchPublic: (filters?: ProjectSearchFilters) => Promise<PaginatedProjects>;
    listCities: () => Promise<ProjectCityCount[]>;
    listCategories: () => Promise<ProjectCategoryCount[]>;
    findBySlug: (slug: string) => Promise<Project>;
    create: (input: CreateProjectInput) => Promise<Project>;
};
