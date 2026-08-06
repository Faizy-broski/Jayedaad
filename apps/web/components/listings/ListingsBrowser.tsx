'use client';

import { useMemo, useState } from 'react';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import { PropertyFilters, DEFAULT_LISTING_FILTERS, type ListingFiltersState } from './PropertyFilters';
import { PropertyGrid } from './PropertyGrid';
import { PropertyMap } from './PropertyMap';
import { Pagination } from './Pagination';
import { ConciergeBanner } from './ConciergeBanner';
import type { ListingProperty } from '@/lib/types';

const SORT_OPTIONS = ['Newest', 'Price: Low to High', 'Price: High to Low'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const PAGE_SIZE = 9;

function matchesFilters(property: ListingProperty, filters: ListingFiltersState): boolean {
  const min = filters.minPrice ? Number(filters.minPrice) : null;
  const max = filters.maxPrice ? Number(filters.maxPrice) : null;

  if (min !== null && property.priceValue < min) return false;
  if (max !== null && property.priceValue > max) return false;
  if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(property.propertyType)) return false;
  if (filters.minBedrooms !== null && property.beds < filters.minBedrooms) return false;
  if (filters.minBathrooms !== null && property.baths < filters.minBathrooms) return false;
  if (filters.verifiedOnly && !property.verified) return false;
  if (filters.furnished && !property.furnished) return false;
  if (filters.newProjects && !property.newProject) return false;
  if (filters.readyToMove && !property.readyToMove) return false;
  if (filters.amenities.length > 0 && !filters.amenities.every((a) => property.amenities.includes(a))) return false;

  return true;
}

function sortProperties(properties: ListingProperty[], sort: SortOption): ListingProperty[] {
  const sorted = [...properties];
  if (sort === 'Price: Low to High') sorted.sort((a, b) => a.priceValue - b.priceValue);
  if (sort === 'Price: High to Low') sorted.sort((a, b) => b.priceValue - a.priceValue);
  return sorted;
}

interface ListingsBrowserProps {
  listings: ListingProperty[];
}

export function ListingsBrowser({ listings }: ListingsBrowserProps) {
  const [draftFilters, setDraftFilters] = useState<ListingFiltersState>(DEFAULT_LISTING_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ListingFiltersState>(DEFAULT_LISTING_FILTERS);
  const [sort, setSort] = useState<SortOption>('Newest');
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => sortProperties(listings.filter((p) => matchesFilters(p, appliedFilters)), sort),
    [listings, appliedFilters, sort]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              <h1 className="text-2xl font-bold text-heading-gradient">{filtered.length} Properties</h1>
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

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            {view === 'grid' ? (
              <>
                <PropertyGrid properties={paged} />
                <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
              </>
            ) : (
              <PropertyMap properties={filtered} />
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
