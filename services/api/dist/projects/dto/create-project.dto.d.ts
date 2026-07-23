declare const PROJECT_STATUSES: readonly ["planned", "under_construction", "ready"];
declare const AREA_UNITS: readonly ["marla", "kanal", "sqyd", "sqft", "sqm", "acre"];
export declare class CreateProjectUnitTypeDto {
    label: string;
    propertyTypeSlug: string;
    areaValueMin?: number;
    areaValueMax?: number;
    areaUnit: (typeof AREA_UNITS)[number];
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    bathrooms?: number;
}
export declare class CreateProjectPaymentPlanDto {
    label: string;
    bookingPercent?: number;
    installmentCount?: number;
    installmentFrequency?: string;
    balloonPaymentCount?: number;
    planDocumentUrl?: string;
    description?: string;
}
export declare class CreateProjectDto {
    name: string;
    slug: string;
    developerId: string;
    description?: string;
    city: string;
    area: string;
    status?: (typeof PROJECT_STATUSES)[number];
    possessionDate?: string;
    coverImageUrl?: string;
    unitTypes?: CreateProjectUnitTypeDto[];
    paymentPlans?: CreateProjectPaymentPlanDto[];
    amenitySlugs?: string[];
}
export {};
