'use client';

import { useState } from 'react';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import {
  listingsRepository,
  useListingSearchViewModel,
  useTaxonomyViewModel,
  type ListingSearchFilters,
} from '@jayedaad/core';
import { Select } from '@jayedaad/ui-web';
import { PropertyFilters, DEFAULT_LISTING_FILTERS, type ListingFiltersState } from './PropertyFilters';
import { PropertyGrid } from './PropertyGrid';
import { PropertyMap } from './PropertyMap';
import { Pagination } from './Pagination';
import { ConciergeBanner } from './ConciergeBanner';
import { listingToListingProperty } from '@/lib/listingMappers';
import type { ListingProperty } from '@/lib/types';

const SORT_OPTIONS = ['Newest', 'Price: Low to High', 'Price: High to Low'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];
const SORT_TO_API: Record<SortOption, 'newest' | 'price_asc' | 'price_desc'> = {
  Newest: 'newest',
  'Price: Low to High': 'price_asc',
  'Price: High to Low': 'price_desc',
};

const PAGE_SIZE = 9;
// Cap per-type fetch when fanning out across a category/multiple selected
// types — GET /listings has no category-level filter, only a single
// propertyTypeSlug, so this merges N real per-type pages client-side (same
// approach as /search's SearchPageContent and /listings' own category
// redirect). Pagination below then slices that real, merged result set.
const FAN_OUT_PAGE_SIZE = 50;

function sortMerged(listings: ListingProperty[], sort: SortOption): ListingProperty[] {
  const sorted = [...listings];
  if (sort === 'Price: Low to High') sorted.sort((a, b) => a.priceValue - b.priceValue);
  else if (sort === 'Price: High to Low') sorted.sort((a, b) => b.priceValue - a.priceValue);
  return sorted;
}

interface ListingsBrowserProps {
  /** Seeds the filter sidebar from a redirect (e.g. Browse by Category's ?propertyTypeCategory=/?city=). */
  initialFilters?: Partial<ListingFiltersState>;
  fallbackListings: ListingProperty[];
}

// Real GET /listings, filtered server-side wherever the API supports it
// (city, price range, bedrooms, bathrooms, furnishing, property type/
// category). readyToMove and amenities have no query param on GET /listings
// yet, so those two narrow the already-server-filtered page client-side —
// everything else genuinely round-trips to the backend on Apply, unlike the
// old version of this page which fetched once and re-filtered a fixed pool.
export function ListingsBrowser({ initialFilters, fallbackListings }: ListingsBrowserProps) {
  const seed = { ...DEFAULT_LISTING_FILTERS, ...initialFilters };
  const [draftFilters, setDraftFilters] = useState<ListingFiltersState>(seed);
  const [appliedFilters, setAppliedFilters] = useState<ListingFiltersState>(seed);
  const [sort, setSort] = useState<SortOption>('Newest');
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [page, setPage] = useState(1);

  const { propertyTypes } = useTaxonomyViewModel();

  const baseFilters: Omit<ListingSearchFilters, 'propertyTypeSlug'> = {
    city: appliedFilters.city || undefined,
    minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
    maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
    bedrooms: appliedFilters.minBedrooms ?? undefined,
    minBathrooms: appliedFilters.minBathrooms ?? undefined,
    furnishingStatus: appliedFilters.furnished ? 'furnished' : undefined,
    sortBy: SORT_TO_API[sort],
  };

  // Explicit property-type checkboxes win; otherwise every type under the
  // chosen category; otherwise this is a plain single-query search.
  const categoryTypeSlugs = appliedFilters.categorySlug
    ? propertyTypes.filter((t) => t.category?.slug === appliedFilters.categorySlug).map((t) => t.slug)
    : [];
  const fanOutSlugs = appliedFilters.propertyTypeSlugs.length > 0 ? appliedFilters.propertyTypeSlugs : categoryTypeSlugs;
  const isFanOut = fanOutSlugs.length > 0;

  // Always called (rules of hooks) even in fan-out mode, where its result is
  // simply unused — cheap, and stays cached if the type/category filter clears.
  const singleResult = useListingSearchViewModel({ ...baseFilters, page, pageSize: PAGE_SIZE });

  const fanOutQueries = useQueries({
    queries: (isFanOut ? fanOutSlugs : []).map((slug) => ({
      queryKey: ['listings', 'public', 'listings-page', slug, baseFilters],
      queryFn: () => listingsRepository.searchPublic({ ...baseFilters, propertyTypeSlug: slug, pageSize: FAN_OUT_PAGE_SIZE }),
    })),
  });

  let rawListings: ListingProperty[];
  let total: number;
  let isLoading: boolean;

  if (isFanOut) {
    const merged = sortMerged(
      fanOutQueries.flatMap((q) => q.data?.items.map(listingToListingProperty) ?? []),
      sort,
    );
    total = merged.length;
    rawListings = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    isLoading = fanOutQueries.some((q) => q.isLoading);
  } else {
    rawListings = singleResult.listings.map(listingToListingProperty);
    total = singleResult.total;
    isLoading = singleResult.isLoading;
  }

  // No GET /listings param exists for either of these yet — applied as a
  // final narrowing over this page's already-server-filtered results.
  let pageListings = rawListings;
  if (appliedFilters.readyToMove) pageListings = pageListings.filter((l) => l.readyToMove);
  if (appliedFilters.amenities.length > 0) {
    pageListings = pageListings.filter((l) => appliedFilters.amenities.every((a) => l.amenities.includes(a)));
  }

  const showLive = !isLoading && pageListings.length > 0;
  const displayed = showLive ? pageListings : fallbackListings;
  const pageCount = showLive ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
  };

  const handleReset = () => {
    setDraftFilters(DEFAULT_LISTING_FILTERS);
    setAppliedFilters(DEFAULT_LISTING_FILTERS);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <PropertyFilters filters={draftFilters} onChange={setDraftFilters} onApply={handleApply} onReset={handleReset} />

        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-heading-gradient">
                {showLive ? total : displayed.length} Verified Properties
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Handpicked estates across Pakistan. Every listing is agent-verified.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 p-1">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-pressed={view === 'grid'}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === 'grid' ? 'bg-heading-gradient text-primary-foreground' : 'text-slate-600'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setView('map')}
                  aria-pressed={view === 'map'}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === 'map' ? 'bg-heading-gradient text-primary-foreground' : 'text-slate-600'
                  }`}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  Map
                </button>
              </div>

              <Select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortOption);
                  setPage(1);
                }}
                className="h-9 w-auto min-w-[9rem] text-xs"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-6">
            {view === 'grid' ? (
              <>
                <PropertyGrid properties={displayed} />
                {showLive && <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />}
              </>
            ) : (
              <PropertyMap properties={displayed} />
            )}
          </div>

          <div className="mt-10">
            <ConciergeBanner />
          </div>
        </div>
      </div>
    </div>
  );
}
