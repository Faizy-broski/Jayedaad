import { TaxonomyRepository } from './taxonomy.repository';
import { CreatePropertyTypeCategoryDto, UpdatePropertyTypeCategoryDto } from './dto/category.dto';
import { CreatePropertyTypeDto, UpdatePropertyTypeDto } from './dto/property-type.dto';
import { CreateAmenityDto, UpdateAmenityDto } from './dto/amenity.dto';
export declare class TaxonomyController {
    private readonly taxonomy;
    constructor(taxonomy: TaxonomyRepository);
    listCategories(): Promise<any[]>;
    listPropertyTypes(): Promise<any[]>;
    listAmenities(propertyTypeCategorySlug?: string): Promise<{
        id: any;
        slug: any;
        label: any;
        category: any;
        valueUnit: any;
        propertyTypeCategories: any;
        sortOrder: any;
    }[]>;
    createCategory(body: CreatePropertyTypeCategoryDto): Promise<any>;
    updateCategory(id: string, body: UpdatePropertyTypeCategoryDto): Promise<any>;
    removeCategory(id: string): Promise<void>;
    createPropertyType(body: CreatePropertyTypeDto): Promise<any>;
    updatePropertyType(id: string, body: UpdatePropertyTypeDto): Promise<any>;
    removePropertyType(id: string): Promise<void>;
    createAmenity(body: CreateAmenityDto): Promise<{
        id: any;
        slug: any;
        label: any;
        category: any;
        valueUnit: any;
        propertyTypeCategories: any;
        sortOrder: any;
    }>;
    updateAmenity(id: string, body: UpdateAmenityDto): Promise<{
        id: any;
        slug: any;
        label: any;
        category: any;
        valueUnit: any;
        propertyTypeCategories: any;
        sortOrder: any;
    }>;
    removeAmenity(id: string): Promise<void>;
}
