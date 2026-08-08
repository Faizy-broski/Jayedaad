'use client';

import { useSearchParams } from 'next/navigation';
import type { AreaUnit } from '@jayedaad/core';
import { ProjectsBrowser } from './ProjectsBrowser';
import { DEFAULT_PROJECT_FILTERS, type ProjectFiltersState } from './ProjectsFilters';

// Seeds every field PropertySearchBar's "projects" variant can send —
// city/propertyTypeSlug/minPrice/maxPrice/minAreaValue/maxAreaValue/
// areaUnit/developerSlug/keyword — so a hero search actually lands here
// pre-filtered, not just on city like before.
export function ProjectsBrowserSection() {
  const searchParams = useSearchParams();

  const initialFilters: Partial<ProjectFiltersState> = {
    city: searchParams.get('city') ?? '',
    area: searchParams.get('area') ?? '',
    propertyTypeSlug: searchParams.get('propertyTypeSlug') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    minAreaValue: searchParams.get('minAreaValue') ?? '',
    maxAreaValue: searchParams.get('maxAreaValue') ?? '',
    areaUnit: (searchParams.get('areaUnit') as AreaUnit) || DEFAULT_PROJECT_FILTERS.areaUnit,
    developerSlug: searchParams.get('developerSlug') ?? '',
    keyword: searchParams.get('keyword') ?? '',
  };

  return <ProjectsBrowser initialFilters={initialFilters} />;
}
