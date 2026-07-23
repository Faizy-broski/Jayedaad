import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto } from './dto/create-project.dto';
export declare class ProjectsController {
    private readonly projects;
    constructor(projects: ProjectsRepository);
    findPublic(city?: string, status?: 'planned' | 'under_construction' | 'ready', propertyTypeSlug?: string, developerSlug?: string, minPrice?: string, maxPrice?: string, minAreaValue?: string, maxAreaValue?: string, areaUnit?: 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre', keyword?: string, sortBy?: 'newest' | 'price_asc' | 'price_desc', page?: string, pageSize?: string): Promise<import("./projects.repository").PaginatedProjects>;
    listCities(): Promise<{
        city: string;
        count: number;
    }[]>;
    listCategories(): Promise<{
        propertyType: {
            slug: string;
            label: string;
        };
        count: number;
    }[]>;
    findBySlug(slug: string): Promise<any>;
    create(body: CreateProjectDto): Promise<any>;
}
