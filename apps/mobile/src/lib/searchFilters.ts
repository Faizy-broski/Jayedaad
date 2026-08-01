import { AreaUnit, ListingPurpose, ListingSearchFilters } from '@jayedaad/core';

// Draft/UI shape for the search filter sheet — string fields for every
// numeric input (matches web's apps/web/app/(buyer)/search/page.tsx exactly:
// plain useState strings, converted to numbers only when building the
// ListingSearchFilters query). Kept mobile-local since web's equivalent is
// also just local page state, not a shared core type.
export interface SearchFilterState {
  purpose: ListingPurpose;
  city: string;
  area: string; // "Location" free-text field, not the numeric area range below
  propertyTypeSlug: string;
  minAreaValue: string;
  maxAreaValue: string;
  areaUnit: AreaUnit;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  minBathrooms: string;
  keyword: string;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilterState = {
  purpose: 'sale',
  city: '',
  area: '',
  propertyTypeSlug: '',
  minAreaValue: '',
  maxAreaValue: '',
  areaUnit: 'marla',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  minBathrooms: '',
  keyword: '',
};

export const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
export const BED_OPTIONS = ['1', '2', '3', '4', '5', '6+'];
export const BATH_OPTIONS = ['1+', '2+', '3+', '4+', '5+'];

// Converts the draft UI state into the actual query filters
// useListingSearchViewModel/listingsRepository.searchPublic expect — same
// string-to-number/undefined conversions as web's page.tsx.
export function toListingSearchFilters(filters: SearchFilterState): ListingSearchFilters {
  return {
    city: filters.city || undefined,
    area: filters.area || undefined,
    propertyTypeSlug: filters.propertyTypeSlug || undefined,
    purpose: filters.purpose,
    bedrooms: filters.bedrooms ? Number(filters.bedrooms.replace('+', '')) : undefined,
    minBathrooms: filters.minBathrooms ? Number(filters.minBathrooms.replace('+', '')) : undefined,
    minAreaValue: filters.minAreaValue ? Number(filters.minAreaValue) : undefined,
    maxAreaValue: filters.maxAreaValue ? Number(filters.maxAreaValue) : undefined,
    areaUnit: filters.areaUnit,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    keyword: filters.keyword || undefined,
  };
}
