import { AreaUnit, ListingSearchFilters } from '@jayedaad/core';
import { SORT_TO_API, SortOption } from './searchFilters';

// Draft/UI shape for the "All Properties" browse screen (Home's Featured
// Properties "See all") — deliberately has NO purpose field, unlike
// SearchFilterState/BuyerSearchScreen's dedicated Buy/Rent search: this
// screen is meant to browse every verified listing at once, same as
// ProjectsScreen shows every verified project with no type split by
// default.
export interface AllPropertiesFilterState {
  city: string;
  area: string;
  propertyTypeSlug: string;
  minAreaValue: string;
  maxAreaValue: string;
  areaUnit: AreaUnit;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  minBathrooms: string;
  keyword: string;
  sortBy: SortOption;
}

export const DEFAULT_ALL_PROPERTIES_FILTERS: AllPropertiesFilterState = {
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
  sortBy: 'Featured',
};

export function toAllPropertiesSearchFilters(filters: AllPropertiesFilterState): ListingSearchFilters {
  return {
    city: filters.city || undefined,
    area: filters.area || undefined,
    propertyTypeSlug: filters.propertyTypeSlug || undefined,
    bedrooms: filters.bedrooms ? Number(filters.bedrooms.replace('+', '')) : undefined,
    minBathrooms: filters.minBathrooms ? Number(filters.minBathrooms.replace('+', '')) : undefined,
    minAreaValue: filters.minAreaValue ? Number(filters.minAreaValue) : undefined,
    maxAreaValue: filters.maxAreaValue ? Number(filters.maxAreaValue) : undefined,
    areaUnit: filters.areaUnit,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    keyword: filters.keyword || undefined,
    sortBy: SORT_TO_API[filters.sortBy],
  };
}
