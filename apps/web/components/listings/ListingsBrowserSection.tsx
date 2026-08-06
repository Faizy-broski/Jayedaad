'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useTaxonomyViewModel } from '@jayedaad/core';
import { ListingsBrowser } from './ListingsBrowser';
import { DEFAULT_LISTING_FILTERS } from './PropertyFilters';
import { LISTINGS } from '@/data/listings';

// All the actual data-fetching/filtering (including the category fan-out —
// GET /listings has no category param, only propertyTypeSlug) lives in
// ListingsBrowser now; this just seeds it from the redirect's URL and shows
// which filter landed the visitor here.
export function ListingsBrowserSection() {
  const searchParams = useSearchParams();
  const propertyTypeCategory = searchParams.get('propertyTypeCategory') ?? '';
  const city = searchParams.get('city') ?? '';

  const { propertyTypes } = useTaxonomyViewModel();
  const categoryLabel = propertyTypes.find((t) => t.category?.slug === propertyTypeCategory)?.category?.label;
  const hasActiveRedirectFilter = Boolean(propertyTypeCategory || city);

  return (
    <>
      {hasActiveRedirectFilter && (
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6">
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            Showing {city || categoryLabel || propertyTypeCategory}
          </span>
          <Link
            href="/listings"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Clear
          </Link>
        </div>
      )}

      <ListingsBrowser
        initialFilters={{ ...DEFAULT_LISTING_FILTERS, categorySlug: propertyTypeCategory, city }}
        fallbackListings={LISTINGS}
      />
    </>
  );
}
