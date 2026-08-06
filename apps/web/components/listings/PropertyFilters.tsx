'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { listingsRepository, useTaxonomyViewModel } from '@jayedaad/core';
import { Select } from '@jayedaad/ui-web';
import { useQuery } from '@tanstack/react-query';

export interface ListingFiltersState {
  city: string;
  minPrice: string;
  maxPrice: string;
  categorySlug: string;
  propertyTypeSlugs: string[];
  minBedrooms: number | null;
  minBathrooms: number | null;
  // verifiedOnly is intentionally not a filter param — GET /listings is
  // already verified-only server-side [Spec §4.2], so every result already
  // qualifies; keeping a checkbox for it would be a no-op that looks live.
  furnished: boolean;
  readyToMove: boolean;
  amenities: string[];
}

export const DEFAULT_LISTING_FILTERS: ListingFiltersState = {
  city: '',
  minPrice: '',
  maxPrice: '',
  categorySlug: '',
  propertyTypeSlugs: [],
  minBedrooms: null,
  minBathrooms: null,
  furnished: false,
  readyToMove: false,
  amenities: [],
};

const BED_BATH_OPTIONS = [1, 2, 3, 4, 5];

const PREFERENCE_TOGGLES: { key: 'furnished' | 'readyToMove'; label: string }[] = [
  { key: 'furnished', label: 'Furnished' },
  { key: 'readyToMove', label: 'Ready to Move' },
];

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

interface PropertyFiltersProps {
  filters: ListingFiltersState;
  onChange: (filters: ListingFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
}

// Category/Property Type/Amenities are real, Super Admin-managed taxonomy
// (GET /taxonomy/property-type-categories, /property-types, /amenities) —
// same data and cascading pattern as the agent submit form's property-type
// picker (apps/web/app/(agent)/submit/page.tsx): pick a category, the
// property-type choices narrow to that category, and amenities scope to
// whichever category is selected. Not a fixed enum like this page used to have.
export function PropertyFilters({ filters, onChange, onApply, onReset }: PropertyFiltersProps) {
  const [propertyTypesOpen, setPropertyTypesOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const set = <K extends keyof ListingFiltersState>(key: K, value: ListingFiltersState[K]) =>
    onChange({ ...filters, [key]: value });

  const { propertyTypes } = useTaxonomyViewModel();
  const { amenities } = useTaxonomyViewModel(filters.categorySlug || undefined);
  const citiesQuery = useQuery({
    queryKey: ['listings', 'cities'],
    queryFn: listingsRepository.listCities,
    staleTime: 5 * 60_000,
  });

  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);
  const typesInSelectedCategory = filters.categorySlug
    ? propertyTypes.filter((t) => t.category?.slug === filters.categorySlug)
    : propertyTypes;

  return (
    <aside className="flex w-full flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price Range</h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => set('minPrice', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
          />
          <span className="shrink-0 text-slate-300">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => set('maxPrice', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">City</h3>
        <Select value={filters.city} onChange={(e) => set('city', e.target.value)} className="mt-3">
          <option value="">Any City</option>
          {(citiesQuery.data ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</h3>
        <Select
          value={filters.categorySlug}
          onChange={(e) => onChange({ ...filters, categorySlug: e.target.value, propertyTypeSlugs: [], amenities: [] })}
          className="mt-3"
        >
          <option value="">Any Category</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="relative">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Property Type</h3>
        <button
          type="button"
          onClick={() => setPropertyTypesOpen((v) => !v)}
          disabled={typesInSelectedCategory.length === 0}
          className="mt-3 flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={filters.propertyTypeSlugs.length === 0 ? 'text-muted-foreground' : undefined}>
            {filters.propertyTypeSlugs.length > 0 ? `${filters.propertyTypeSlugs.length} Selected` : 'Any Type'}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${propertyTypesOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {propertyTypesOpen && typesInSelectedCategory.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-md border border-border bg-background p-1 shadow-lg">
            {typesInSelectedCategory.map((type) => {
              const active = filters.propertyTypeSlugs.includes(type.slug);
              return (
                <label
                  key={type.slug}
                  className={`flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 text-sm transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => set('propertyTypeSlugs', toggleInList(filters.propertyTypeSlugs, type.slug))}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  {type.label}
                </label>
              );
            })}
            <button
              type="button"
              onClick={() => setPropertyTypesOpen(false)}
              className="mt-1 w-full rounded-sm bg-primary py-1.5 text-sm font-medium text-primary-foreground"
            >
              Done
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bedrooms</h3>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {BED_BATH_OPTIONS.map((n) => {
            const active = filters.minBedrooms === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => set('minBedrooms', active ? null : n)}
                className={`flex h-9 w-full items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {n}+
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bathrooms</h3>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {BED_BATH_OPTIONS.map((n) => {
            const active = filters.minBathrooms === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => set('minBathrooms', active ? null : n)}
                className={`flex h-9 w-full items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {n}+
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferences</h3>
        <div className="mt-3 flex flex-col gap-3">
          {PREFERENCE_TOGGLES.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center justify-between text-sm text-slate-700">
              {label}
              <span
                role="switch"
                aria-checked={filters[key]}
                onClick={() => set(key, !filters[key])}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  filters[key] ? 'bg-heading-gradient' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    filters[key] ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="relative">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amenities</h3>
        <button
          type="button"
          onClick={() => setAmenitiesOpen((v) => !v)}
          disabled={amenities.length === 0}
          className="mt-3 flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={filters.amenities.length === 0 ? 'text-muted-foreground' : undefined}>
            {filters.amenities.length > 0 ? `${filters.amenities.length} Selected` : 'Any Amenities'}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${amenitiesOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {amenities.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Pick a category above to see its amenities.</p>
        ) : (
          amenitiesOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-md border border-border bg-background p-1 shadow-lg">
              {amenities.map((amenity) => {
                const active = filters.amenities.includes(amenity.label);
                return (
                  <label
                    key={amenity.slug}
                    className={`flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 text-sm transition-colors ${
                      active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => set('amenities', toggleInList(filters.amenities, amenity.label))}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                    />
                    {amenity.label}
                  </label>
                );
              })}
              <button
                type="button"
                onClick={() => setAmenitiesOpen(false)}
                className="mt-1 w-full rounded-sm bg-primary py-1.5 text-sm font-medium text-primary-foreground"
              >
                Done
              </button>
            </div>
          )
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-[2] rounded-full bg-heading-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
