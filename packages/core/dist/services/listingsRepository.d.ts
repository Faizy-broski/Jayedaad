import { AreaUnit, ContactNumberType, FurnishingStatus, Listing, ListingDocument, ListingDocumentType, ListingPurpose, ListingStatus } from '../models';
export interface ListingSearchFilters {
    listingId?: string;
    listingNumber?: number;
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
    listingNumber?: number;
    city?: string;
    area?: string;
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
    textValue?: string;
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
    contactNumbers?: {
        type: ContactNumberType;
        countryCode?: string;
        number: string;
    }[];
    amenities?: CreateListingAmenityInput[];
    media?: CreateListingMediaInput[];
}
export interface CreateListingMediaInput {
    url: string;
    type: 'image' | 'video';
    isCover?: boolean;
    sortOrder?: number;
}
export declare const listingsRepository: {
    searchPublic: (filters: ListingSearchFilters) => Promise<PaginatedListings>;
    findMine: (filters?: MyListingsFilters) => Promise<PaginatedListings>;
    getMyStatusCounts: () => Promise<Record<string, number>>;
    findById: (listingId: string) => Promise<Listing>;
    findSimilar: (listingId: string) => Promise<Listing[]>;
    trackEngagement: (listingId: string, input: {
        type: "call" | "whatsapp" | "sms";
        platform: "web" | "mobile";
        viewerSessionId: string;
    }) => Promise<void>;
    listCities: () => Promise<string[]>;
    listAreas: (city: string) => Promise<string[]>;
    create: (input: CreateListingInput) => Promise<Listing>;
    createDraft: (input: CreateListingInput) => Promise<Listing>;
    submitDraft: (listingId: string) => Promise<Listing>;
    setStatus: (listingId: string, status: ListingStatus) => Promise<Listing>;
    updateListing: (listingId: string, input: Partial<CreateListingInput>) => Promise<Listing>;
    deleteListing: (listingId: string) => Promise<Listing>;
    uploadDocument: (listingId: string, documentType: ListingDocumentType, file: any) => Promise<ListingDocument>;
    listDocuments: (listingId: string) => Promise<ListingDocument[]>;
    uploadListingMedia: (file: any) => Promise<{
        url: string;
        type: "image" | "video";
    }>;
};
