declare const AREA_UNITS: readonly ["marla", "kanal", "sqyd", "sqft", "sqm", "acre"];
declare const FURNISHING_STATUSES: readonly ["unfurnished", "semi_furnished", "furnished"];
declare const CONTACT_NUMBER_TYPES: readonly ["mobile", "landline"];
declare const LISTING_MEDIA_TYPES: readonly ["image", "video"];
export declare class CreateListingContactNumberDto {
    type: (typeof CONTACT_NUMBER_TYPES)[number];
    countryCode?: string;
    number: string;
}
export declare class CreateListingAmenityDto {
    slug: string;
    value?: number;
    textValue?: string;
}
export declare class CreateListingMediaDto {
    url: string;
    type: (typeof LISTING_MEDIA_TYPES)[number];
    isCover?: boolean;
    sortOrder?: number;
}
export declare class CreateListingDto {
    propertyTypeId: string;
    purpose: 'sale' | 'rent';
    title: string;
    description?: string;
    price: number;
    city: string;
    area: string;
    society?: string;
    subArea?: string;
    bedrooms?: number;
    bathrooms?: number;
    kitchens?: number;
    floors?: number;
    areaValue: number;
    areaUnit: (typeof AREA_UNITS)[number];
    yearBuilt?: number;
    floorLevel?: string;
    furnishingStatus?: (typeof FURNISHING_STATUSES)[number];
    installmentAvailable?: boolean;
    readyForPossession?: boolean;
    advanceAmount?: number;
    numberOfInstallments?: number;
    monthlyInstallment?: number;
    balloonPaymentAvailable?: boolean;
    balloonPaymentAmount?: number;
    ballotingFeeApplicable?: boolean;
    ballotingFeeAmount?: number;
    possessionFeeApplicable?: boolean;
    possessionFeeAmount?: number;
    developmentFeeApplicable?: boolean;
    developmentFeeAmount?: number;
    contactNumbers?: CreateListingContactNumberDto[];
    amenities?: CreateListingAmenityDto[];
    media?: CreateListingMediaDto[];
}
export {};
