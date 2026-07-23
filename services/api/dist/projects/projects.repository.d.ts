import { SupabaseService } from '../supabase/supabase.service';
import { CreateProjectDto } from './dto/create-project.dto';
export interface ProjectSearchFilters {
    city?: string;
    status?: 'planned' | 'under_construction' | 'ready';
    propertyTypeSlug?: string;
    developerSlug?: string;
    minPrice?: number;
    maxPrice?: number;
    minAreaValue?: number;
    maxAreaValue?: number;
    areaUnit?: 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre';
    keyword?: string;
    sortBy?: 'newest' | 'price_asc' | 'price_desc';
    page?: number;
    pageSize?: number;
}
export interface PaginatedProjects {
    items: ReturnType<typeof mapProjectRow>[];
    total: number;
    page: number;
    pageSize: number;
}
declare function mapProjectRow(row: any, priceRange: {
    min: number;
    max: number;
} | null): {
    id: any;
    name: any;
    slug: any;
    developer: any;
    description: any;
    city: any;
    area: any;
    status: any;
    possessionDate: any;
    coverImageUrl: any;
    priceRange: {
        min: number;
        max: number;
    } | null;
};
export declare class ProjectsRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    findPublic(filters?: ProjectSearchFilters): Promise<PaginatedProjects>;
    private getPriceRangeByProject;
    listCitiesWithCounts(): Promise<{
        city: string;
        count: number;
    }[]>;
    listCategoriesWithCounts(): Promise<{
        propertyType: {
            slug: string;
            label: string;
        };
        count: number;
    }[]>;
    findBySlug(slug: string): Promise<any>;
    create(input: CreateProjectDto): Promise<any>;
}
export {};
