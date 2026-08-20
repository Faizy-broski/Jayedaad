'use client';

import { useState } from 'react';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import {
  listingsRepository,
  useListingSearchViewModel,
  useTaxonomyViewModel,
  type ListingPurpose,
  type ListingSearchFilters,
} from '@jayedaad/core';
import { Select } from '@jayedaad/ui-web';
import { PropertyFilters, DEFAULT_LISTING_FILTERS, type ListingFiltersState } from './PropertyFilters';
import { PropertyGrid } from './PropertyGrid';
import { PropertyMap } from './PropertyMap';
import { Pagination } from './Pagination';
import { listingToListingProperty } from '@/lib/listingMappers';
import { ConciergeBanner } from './ConciergeBanner';
import type { ListingProperty } from '@/lib/types';

// 'Featured' surfaces the API's 'relevance' sort — boost_tier-aware ordering
// (spent Hot/Super Hot/Refresh credits) that already existed server-side
// (applySort() in listings.repository.ts) but had no UI to select it. Made
// the default so a boosted listing's credit spend actually shows up as
// "ranked higher" to a buyer without them having to change anything.
const SORT_OPTIONS = ['Featured', 'Newest', 'Price: Low to High', 'Price: High to Low'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];
const SORT_TO_API: Record<SortOption, 'relevance' | 'newest' | 'price_asc' | 'price_desc'> = {
  Featured: 'relevance',
  Newest: 'newest',
  'Price: Low to High': 'price_asc',
  'Price: High to Low': 'price_desc',
};

const BOOST_RANK: Record<string, number> = { super_hot: 3, hot: 2, premium: 1, basic: 0 };

const PAGE_SIZE = 9;

// Cap per-type fetch when fanning out across a category/multiple selected
// types — GET /listings has no category-level filter, only a single
// propertyTypeSlug, so this merges N real per-type pages client-side (same
// approach as /listings' own category redirect). Pagination below then
// slices that real, merged result set.
const FAN_OUT_PAGE_SIZE = 50;

function sortMerged(listings: ListingProperty[], sort: SortOption): ListingProperty[] {
  const sorted = [...listings];
  if (sort === 'Price: Low to High') sorted.sort((a, b) => a.priceValue - b.priceValue);
  else if (sort === 'Price: High to Low') sorted.sort((a, b) => b.priceValue - a.priceValue);
  // Fan-out mode merges N real per-type server pages (each already sorted
  // by boost_tier server-side) client-side — re-sorting by the same
  // boost_tier rank here keeps that ordering across the merge instead of
  // reverting to whatever order the per-type pages happened to interleave in.
  else if (sort === 'Featured') sorted.sort((a, b) => (BOOST_RANK[b.boostTier ?? 'basic'] ?? 0) - (BOOST_RANK[a.boostTier ?? 'basic'] ?? 0));
  return sorted;
}

// readyToMove and amenities have no query param on GET /listings, so they
// narrow the already server-filtered page here instead.
function applyClientFilters(listings: ListingProperty[], filters: ListingFiltersState): ListingProperty[] {
  return listings.filter((listing) => {
    if (filters.readyToMove && !listing.readyToMove) return false;
    if (filters.amenities.length > 0 && !filters.amenities.every((a) => listing.amenities.includes(a))) return false;
    return true;
  });
}

interface ListingsBrowserProps {
   /** Seeds the filter sidebar from a redirect (e.g. Browse by Category's ?propertyTypeCategory=/?city=). */
  initialFilters?: Partial<ListingFiltersState>;
  /** Fixed for the whole page (Buy & Sell = 'sale', Rent = 'rent') — unlike
   * every other filter, purpose isn't user-editable in the sidebar; switching
   * it means switching pages via PropertySearchBar's Buy/Rent tabs. Omitted
   * entirely (undefined) on /listings, which deliberately shows both. */
  purpose?: ListingPurpose;
  /** Scopes every query to one agency's listings — set only by a redirect
   * from the Agency detail page (?agencySlug=, apps/web /agents/[slug]),
   * never user-editable in the sidebar. */
  agencySlug?: string;
}

// Real GET /listings, filtered server-side wherever the API supports it
// (city, price range, bedrooms, bathrooms, furnishing, property type/
// category). readyToMove and amenities have no query param on GET /listings
// yet, so those two narrow the already-server-filtered page client-side —
// everything else genuinely round-trips to the backend on Apply, unlike the
// old version of this page which fetched once and re-filtered a fixed pool.
export function ListingsBrowser({ initialFilters, purpose, agencySlug }: ListingsBrowserProps) {
  const seed = { ...DEFAULT_LISTING_FILTERS, ...initialFilters };
  const [draftFilters, setDraftFilters] = useState<ListingFiltersState>(seed);
  const [appliedFilters, setAppliedFilters] = useState<ListingFiltersState>(seed);
  const [sort, setSort] = useState<SortOption>('Featured');
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [page, setPage] = useState(1);

  const { propertyTypes } = useTaxonomyViewModel();

  const baseFilters: Omit<ListingSearchFilters, 'propertyTypeSlug'> = {
    purpose,
    agencySlug,
    city: appliedFilters.city || undefined,
    area: appliedFilters.area || undefined,
    minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
    maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
    minAreaValue: appliedFilters.minAreaValue ? Number(appliedFilters.minAreaValue) : undefined,
    maxAreaValue: appliedFilters.maxAreaValue ? Number(appliedFilters.maxAreaValue) : undefined,
    areaUnit: appliedFilters.areaUnit,
    bedrooms: appliedFilters.minBedrooms ?? undefined,
    minBathrooms: appliedFilters.minBathrooms ?? undefined,
    furnishingStatus: appliedFilters.furnished ? 'furnished' : undefined,
    posterType: appliedFilters.posterType || undefined,
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
    queries: fanOutSlugs.map((slug) => ({
      queryKey: ['listings', 'public', 'fanout', slug, baseFilters],
      queryFn: () => listingsRepository.searchPublic({ ...baseFilters, propertyTypeSlug: slug, pageSize: FAN_OUT_PAGE_SIZE }),
      enabled: isFanOut,
    })),
  });

  const merged = isFanOut
    ? applyClientFilters(
        sortMerged(fanOutQueries.flatMap((q) => q.data?.items.map(listingToListingProperty) ?? []), sort),
        appliedFilters,
      )
    : [];
  const isLoading = isFanOut ? fanOutQueries.some((q) => q.isLoading) : singleResult.isLoading;

  const total = isFanOut ? merged.length : singleResult.total;
  const pageCount = isFanOut ? Math.max(1, Math.ceil(merged.length / PAGE_SIZE)) : Math.max(1, Math.ceil(singleResult.total / PAGE_SIZE));
  const showPagination = !isLoading && total > 0;

  const displayed = isFanOut
    ? merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : applyClientFilters(singleResult.listings.map(listingToListingProperty), appliedFilters);

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
                {total} Verified Properties{purpose === 'sale' ? ' For Sale' : purpose === 'rent' ? ' For Rent' : ''}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Handpicked estates across Pakistan. Every listing&apos;s ownership is verified.
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
            {isLoading ? (
              <p className="py-16 text-center text-sm text-slate-500">Loading properties…</p>
            ) : view === 'grid' ? (
              <>
                 <PropertyGrid properties={displayed} />
                {showPagination && <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />}
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
