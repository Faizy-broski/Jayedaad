import { AreaUnit, ProjectSearchFilters } from '@jayedaad/core';

// Draft/UI shape for the Projects filter bar + sheet — same string-field
// convention as searchFilters.ts's SearchFilterState, converted to numbers
// only when building the real ProjectSearchFilters query.
export interface ProjectFilterState {
  city: string;
  area: string; // "Location" free-text field, not the numeric area range below
  keyword: string; // "Project Title" search
  propertyTypeSlug: string;
  developerSlug: string;
  minPrice: string;
  maxPrice: string;
  minAreaValue: string;
  maxAreaValue: string;
  areaUnit: AreaUnit;
}

export const DEFAULT_PROJECT_FILTERS: ProjectFilterState = {
  city: '',
  area: '',
  keyword: '',
  propertyTypeSlug: '',
  developerSlug: '',
  minPrice: '',
  maxPrice: '',
  minAreaValue: '',
  maxAreaValue: '',
  areaUnit: 'marla',
};

export function toProjectSearchFilters(filters: ProjectFilterState): ProjectSearchFilters {
  return {
    city: filters.city || undefined,
    area: filters.area || undefined,
    keyword: filters.keyword || undefined,
    propertyTypeSlug: filters.propertyTypeSlug || undefined,
    developerSlug: filters.developerSlug || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    minAreaValue: filters.minAreaValue ? Number(filters.minAreaValue) : undefined,
    maxAreaValue: filters.maxAreaValue ? Number(filters.maxAreaValue) : undefined,
    areaUnit: filters.areaUnit,
  };
}
