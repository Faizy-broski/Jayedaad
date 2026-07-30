import { CreateAmenityInput, CreatePropertyTypeCategoryInput, CreatePropertyTypeInput, UpdateAmenityInput, UpdatePropertyTypeCategoryInput, UpdatePropertyTypeInput } from '../models';
export declare function useTaxonomyManagementViewModel(): {
    categories: NoInfer<import("..").PropertyTypeCategory[]>;
    propertyTypes: NoInfer<import("..").PropertyType[]>;
    amenities: NoInfer<import("..").Amenity[]>;
    isLoading: boolean;
    createCategory: import("@tanstack/react-query").UseMutationResult<import("..").PropertyTypeCategory, Error, CreatePropertyTypeCategoryInput, unknown>;
    updateCategory: import("@tanstack/react-query").UseMutationResult<import("..").PropertyTypeCategory, Error, {
        id: string;
        input: UpdatePropertyTypeCategoryInput;
    }, unknown>;
    removeCategory: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
    createPropertyType: import("@tanstack/react-query").UseMutationResult<import("..").PropertyType, Error, CreatePropertyTypeInput, unknown>;
    updatePropertyType: import("@tanstack/react-query").UseMutationResult<import("..").PropertyType, Error, {
        id: string;
        input: UpdatePropertyTypeInput;
    }, unknown>;
    removePropertyType: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
    createAmenity: import("@tanstack/react-query").UseMutationResult<import("..").Amenity, Error, CreateAmenityInput, unknown>;
    updateAmenity: import("@tanstack/react-query").UseMutationResult<import("..").Amenity, Error, {
        id: string;
        input: UpdateAmenityInput;
    }, unknown>;
    removeAmenity: import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
};
