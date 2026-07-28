import { AreaUnit, ContactNumberType, FurnishingStatus, Listing, ListingDocument, ListingDocumentType, ListingPurpose, ListingStatus } from '../models';
export interface ListingSearchFilters {
    city?: string;
    area?: string;
    propertyTypeSlug?: string;
    purpose?: ListingPurpose;
    bedrooms?: number;
    minBathrooms?: number;
    minAreaValue?: number;
    maxAreaValue?: number;
    areaUnit?: AreaUnit;
    minPrice?: number;
    maxPrice?: number;
    keyword?: string;
    furnishingStatus?: FurnishingStatus;
    hasVideo?: boolean;
    agencySlug?: string;
    sortBy?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
    page?: number;
    pageSize?: number;
}
export interface MyListingsFilters {
    status?: ListingStatus;
    propertyTypeCategory?: string;
    propertyTypeSlug?: string;
    purpose?: ListingPurpose;
    listingId?: string;
    minPrice?: number;
    maxPrice?: number;
    minAreaValue?: number;
    maxAreaValue?: number;
    areaUnit?: AreaUnit;
    listedDateFrom?: string;
    listedDateTo?: string;
    page?: number;
    pageSize?: number;
}
export interface PaginatedListings {
    items: Listing[];
    total: number;
    page: number;
    pageSize: number;
}
export interface CreateListingAmenityInput {
    slug: string;
    value?: number;
}
export interface CreateListingInput {
    propertyTypeId: string;
    purpose: ListingPurpose;
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
    areaUnit: AreaUnit;
    yearBuilt?: number;
    floorLevel?: string;
    furnishingStatus?: FurnishingStatus;
    installmentAvailable?: boolean;
    readyForPossession?: boolean;
    contactNumbers?: {
        type: ContactNumberType;
        countryCode?: string;
        number: string;
    }[];
    amenities?: CreateListingAmenityInput[];
}
export declare const listingsRepository: {
    searchPublic: (filters: ListingSearchFilters) => Promise<PaginatedListings>;
    findMine: (filters?: MyListingsFilters) => Promise<PaginatedListings>;
    getMyStatusCounts: () => Promise<Record<string, number>>;
    findById: (listingId: string) => Promise<Listing>;
    findSimilar: (listingId: string) => Promise<Listing[]>;
    listCities: () => Promise<string[]>;
    listAreas: (city: string) => Promise<string[]>;
    create: (input: CreateListingInput) => Promise<Listing>;
    uploadDocument: (listingId: string, documentType: ListingDocumentType, file: any) => Promise<ListingDocument>;
    listDocuments: (listingId: string) => Promise<ListingDocument[]>;
};
