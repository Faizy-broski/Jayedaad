declare const AMENITY_CATEGORIES: readonly ["main_features", "rooms", "business_communication", "community_features", "healthcare_recreation", "nearby_locations", "other_facilities"];
declare const AMENITY_VALUE_TYPES: readonly ["boolean", "number", "text", "select"];
export declare class CreateAmenityDto {
    slug: string;
    label: string;
    category: (typeof AMENITY_CATEGORIES)[number];
    valueType?: (typeof AMENITY_VALUE_TYPES)[number];
    valueUnit?: string;
    options?: string[];
    propertyTypeCategoryIds?: string[];
    sortOrder?: number;
}
export declare class UpdateAmenityDto {
    slug?: string;
    label?: string;
    category?: (typeof AMENITY_CATEGORIES)[number];
    valueType?: (typeof AMENITY_VALUE_TYPES)[number];
    valueUnit?: string;
    options?: string[];
    propertyTypeCategoryIds?: string[];
    sortOrder?: number;
}
export {};
