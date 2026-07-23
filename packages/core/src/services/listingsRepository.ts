import { httpClient } from './httpClient';
import {
  AreaUnit,
  ContactNumberType,
  FurnishingStatus,
  Listing,
  ListingDocument,
  ListingDocumentType,
  ListingPurpose,
  ListingStatus,
} from '../models';

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

// Mirrors services/api/src/listings/listings.repository.ts::MyListingsFilters
// — confirmed real on the live Profolio "My Listings" filter panel.
export interface MyListingsFilters {
  status?: ListingStatus;
  // A category slug — property_type_categories is Super Admin-managed data
  // now, not a fixed enum, so this is deliberately `string`, not a union.
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

// Mirrors services/api/src/listings/listings.repository.ts::PaginatedListings
// — GET /listings now returns a page, not a bare array (it was unbounded
// before this pass, a real bug at any real data volume).
export interface PaginatedListings {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
}

// value is only meaningful for amenities with a valueUnit set on the
// catalog (e.g. "Parking Spaces: 2"). Only amenities linked to the
// listing's property-type category are accepted — validated server-side.
export interface CreateListingAmenityInput {
  slug: string;
  value?: number;
}

// Mirrors services/api/src/listings/dto/create-listing.dto.ts — status is
// deliberately not a field here; the API always forces pending_verification.
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
  contactNumbers?: { type: ContactNumberType; countryCode?: string; number: string }[];
  amenities?: CreateListingAmenityInput[];
}

export const listingsRepository = {
  searchPublic: async (filters: ListingSearchFilters): Promise<PaginatedListings> => {
    const { data } = await httpClient.get('/listings', { params: filters });
    return data;
  },

  // Role-aware on the API side: owners see what they submitted, agents see
  // what they're assigned to (the real Profolio "My Listings" page).
  findMine: async (filters: MyListingsFilters = {}): Promise<PaginatedListings> => {
    const { data } = await httpClient.get('/listings/mine', { params: filters });
    return data;
  },

  // Backs the status tab badges ("Active (0)", "Pending (0)", etc.).
  getMyStatusCounts: async (): Promise<Record<string, number>> => {
    const { data } = await httpClient.get('/listings/mine/status-counts');
    return data;
  },

  // The property detail page itself — confirmed real via a scraped Zameen
  // listing detail page.
  findById: async (listingId: string): Promise<Listing> => {
    const { data } = await httpClient.get(`/listings/${listingId}`);
    return data;
  },

  findSimilar: async (listingId: string): Promise<Listing[]> => {
    const { data } = await httpClient.get(`/listings/${listingId}/similar`);
    return data;
  },

  listCities: async (): Promise<string[]> => {
    const { data } = await httpClient.get('/listings/locations/cities');
    return data;
  },

  listAreas: async (city: string): Promise<string[]> => {
    const { data } = await httpClient.get('/listings/locations/areas', { params: { city } });
    return data;
  },

  create: async (input: CreateListingInput): Promise<Listing> => {
    const { data } = await httpClient.post('/listings', input);
    return data;
  },

  // Real property-verification requirement — ID card front/back, ownership
  // proof, last utility bill. `file` is platform-specific (a browser File on
  // web, a { uri, name, type } asset object on React Native), left untyped
  // here since packages/core stays framework-agnostic.
  uploadDocument: async (listingId: string, documentType: ListingDocumentType, file: any): Promise<ListingDocument> => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    const { data } = await httpClient.post(`/listings/${listingId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  listDocuments: async (listingId: string): Promise<ListingDocument[]> => {
    const { data } = await httpClient.get(`/listings/${listingId}/documents`);
    return data;
  },
};
