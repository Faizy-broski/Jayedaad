'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useTaxonomyViewModel, type AreaUnit, type ListingPurpose } from '@jayedaad/core';
import { ListingsBrowser } from './ListingsBrowser';
import { DEFAULT_LISTING_FILTERS } from './PropertyFilters';

interface ListingsBrowserSectionProps {
  /** Fixed page-level purpose for /buy-sell ('sale') and /rent ('rent') —
   * omitted on /listings, which shows both. */
  purpose?: ListingPurpose;
  /** Where "Clear"/redirect-filter links inside this section point back to —
   * defaults to /listings, but /buy-sell and /rent need their own path so
   * clearing a filter doesn't drop the purpose scope. */
  basePath?: string;
}

// All the actual data-fetching/filtering (including the category fan-out —
// GET /listings has no category param, only propertyTypeSlug) lives in
// ListingsBrowser now; this just seeds it from the redirect's URL — the
// homepage's Browse by Category/Where We Live cards, and now
// PropertySearchBar's full field set — and shows which filter landed the
// visitor here.
export function ListingsBrowserSection({ purpose, basePath = '/listings' }: ListingsBrowserSectionProps) {
  const searchParams = useSearchParams();
  const propertyTypeCategory = searchParams.get('propertyTypeCategory') ?? '';
  const city = searchParams.get('city') ?? '';

  const { propertyTypes } = useTaxonomyViewModel();
  const categoryLabel = propertyTypes.find((t) => t.category?.slug === propertyTypeCategory)?.category?.label;
  const hasActiveRedirectFilter = Boolean(propertyTypeCategory || city);

  const initialFilters = {
    ...DEFAULT_LISTING_FILTERS,
    categorySlug: propertyTypeCategory,
    city,
    area: searchParams.get('area') ?? '',
    propertyTypeSlugs: searchParams.get('propertyTypeSlug') ? [searchParams.get('propertyTypeSlug')!] : [],
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    minAreaValue: searchParams.get('minAreaValue') ?? '',
    maxAreaValue: searchParams.get('maxAreaValue') ?? '',
    areaUnit: (searchParams.get('areaUnit') as AreaUnit) || DEFAULT_LISTING_FILTERS.areaUnit,
  };

  return (
    <>
      {hasActiveRedirectFilter && (
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6">
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            Showing {city || categoryLabel || propertyTypeCategory}
          </span>
          <Link
            href={basePath}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Clear
          </Link>
        </div>
      )}

      <ListingsBrowser initialFilters={initialFilters} purpose={purpose} />
    </>
  );
}
