'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useTaxonomyViewModel, type AreaUnit, type ListingPurpose } from '@jayedaad/core';
import { ListingsBrowser } from './ListingsBrowser';
import { DEFAULT_LISTING_FILTERS } from './PropertyFilters';

// All the actual data-fetching/filtering (including the category fan-out —
// GET /listings has no category param, only propertyTypeSlug) lives in
// ListingsBrowser now; this just seeds it from the redirect's URL — the
// homepage's Browse by Category/Where We Live cards, the nav's Buy & Sell /
// Rent links (?purpose=sale/rent), PropertySearchBar's full field set, and
// the Agency detail page's "Properties By [Agency]" stat tiles
// (?agencySlug=&agencyName=, apps/web /agents/[slug]) — and shows which
// filter landed the visitor here.
export function ListingsBrowserSection() {
  const searchParams = useSearchParams();
  const purposeParam = searchParams.get('purpose');
  const purpose: ListingPurpose | undefined = purposeParam === 'sale' || purposeParam === 'rent' ? purposeParam : undefined;
  const propertyTypeCategory = searchParams.get('propertyTypeCategory') ?? '';
  const city = searchParams.get('city') ?? '';
  const agencySlug = searchParams.get('agencySlug') ?? '';
  // Display-only — GET /listings has no way to look up an agency's name from
  // its slug, so the Agency detail page passes it alongside agencySlug
  // purely for this badge; it plays no role in the actual filter/query.
  const agencyName = searchParams.get('agencyName') ?? '';

  const { propertyTypes } = useTaxonomyViewModel();
  const categoryLabel = propertyTypes.find((t) => t.category?.slug === propertyTypeCategory)?.category?.label;
  const propertyTypeLabel = propertyTypes.find((t) => t.slug === searchParams.get('propertyTypeSlug'))?.label;
  const hasActiveRedirectFilter = Boolean(propertyTypeCategory || city || agencySlug);

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

  // Clearing drops the agency scope too (back to the plain, sitewide
  // /listings) — same "redirect filter is a one-shot landing, not a sticky
  // scope" convention as city/category.
  const clearHref = purpose ? `/listings?purpose=${purpose}` : '/listings';

  return (
    <>
      {hasActiveRedirectFilter && (
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6">
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            Showing {agencyName ? `listings from ${agencyName}` : city || propertyTypeLabel || categoryLabel || propertyTypeCategory}
          </span>
          <Link href={clearHref} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
            <X className="h-3 w-3" />
            Clear
          </Link>
        </div>
      )}

      <ListingsBrowser initialFilters={initialFilters} purpose={purpose} agencySlug={agencySlug || undefined} />
    </>
  );
}
