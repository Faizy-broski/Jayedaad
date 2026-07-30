import { Amenity, CreateAmenityInput, CreatePropertyTypeCategoryInput, CreatePropertyTypeInput, PropertyType, PropertyTypeCategory, UpdateAmenityInput, UpdatePropertyTypeCategoryInput, UpdatePropertyTypeInput } from '../models';
export declare const taxonomyRepository: {
    listCategories: () => Promise<PropertyTypeCategory[]>;
    listPropertyTypes: () => Promise<PropertyType[]>;
    listAmenities: (propertyTypeCategorySlug?: string) => Promise<Amenity[]>;
    createCategory: (input: CreatePropertyTypeCategoryInput) => Promise<PropertyTypeCategory>;
    updateCategory: (id: string, input: UpdatePropertyTypeCategoryInput) => Promise<PropertyTypeCategory>;
    removeCategory: (id: string) => Promise<void>;
    createPropertyType: (input: CreatePropertyTypeInput) => Promise<PropertyType>;
    updatePropertyType: (id: string, input: UpdatePropertyTypeInput) => Promise<PropertyType>;
    removePropertyType: (id: string) => Promise<void>;
    createAmenity: (input: CreateAmenityInput) => Promise<Amenity>;
    updateAmenity: (id: string, input: UpdateAmenityInput) => Promise<Amenity>;
    removeAmenity: (id: string) => Promise<void>;
};
