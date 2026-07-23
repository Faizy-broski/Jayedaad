declare const AMENITY_CATEGORIES: readonly ["main_features", "rooms", "business_communication", "community_features", "healthcare_recreation", "nearby_locations", "other_facilities"];
export declare class CreateAmenityDto {
    slug: string;
    label: string;
    category: (typeof AMENITY_CATEGORIES)[number];
    valueUnit?: string;
    propertyTypeCategoryIds?: string[];
    sortOrder?: number;
}
export declare class UpdateAmenityDto {
    slug?: string;
    label?: string;
    category?: (typeof AMENITY_CATEGORIES)[number];
    valueUnit?: string;
    propertyTypeCategoryIds?: string[];
    sortOrder?: number;
}
export {};
