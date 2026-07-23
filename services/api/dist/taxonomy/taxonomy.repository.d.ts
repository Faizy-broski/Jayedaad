import { SupabaseService } from '../supabase/supabase.service';
import { CreatePropertyTypeCategoryDto, UpdatePropertyTypeCategoryDto } from './dto/category.dto';
import { CreatePropertyTypeDto, UpdatePropertyTypeDto } from './dto/property-type.dto';
import { CreateAmenityDto, UpdateAmenityDto } from './dto/amenity.dto';
export declare class TaxonomyRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    listCategories(): Promise<any[]>;
    createCategory(input: CreatePropertyTypeCategoryDto): Promise<any>;
    updateCategory(id: string, input: UpdatePropertyTypeCategoryDto): Promise<any>;
    removeCategory(id: string): Promise<void>;
    listPropertyTypes(): Promise<any[]>;
    createPropertyType(input: CreatePropertyTypeDto): Promise<any>;
    updatePropertyType(id: string, input: UpdatePropertyTypeDto): Promise<any>;
    removePropertyType(id: string): Promise<void>;
    private static readonly AMENITY_COLUMNS;
    listAmenities(filters?: {
        propertyTypeCategorySlug?: string;
    }): Promise<{
        id: any;
        slug: any;
        label: any;
        category: any;
        valueUnit: any;
        propertyTypeCategories: any;
        sortOrder: any;
    }[]>;
    createAmenity(input: CreateAmenityDto): Promise<{
        id: any;
        slug: any;
        label: any;
        category: any;
        valueUnit: any;
        propertyTypeCategories: any;
        sortOrder: any;
    }>;
    updateAmenity(id: string, input: UpdateAmenityDto): Promise<{
        id: any;
        slug: any;
        label: any;
        category: any;
        valueUnit: any;
        propertyTypeCategories: any;
        sortOrder: any;
    }>;
    removeAmenity(id: string): Promise<void>;
    private findAmenityById;
    private syncAmenityCategoryLinks;
}
