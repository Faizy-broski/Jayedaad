'use client';

import type { AmenityOption, PropertyTypeOption } from '@/lib/types';

export interface ListingFiltersState {
  minPrice: string;
  maxPrice: string;
  propertyTypes: PropertyTypeOption[];
  minBedrooms: number | null;
  minBathrooms: number | null;
  verifiedOnly: boolean;
  furnished: boolean;
  newProjects: boolean;
  readyToMove: boolean;
  amenities: AmenityOption[];
}

export const DEFAULT_LISTING_FILTERS: ListingFiltersState = {
  minPrice: '',
  maxPrice: '',
  propertyTypes: [],
  minBedrooms: null,
  minBathrooms: null,
  verifiedOnly: false,
  furnished: false,
  newProjects: false,
  readyToMove: false,
  amenities: [],
};

const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = ['Villa', 'Apartment', 'Penthouse', 'Townhouse', 'House', 'Bungalow'];
const BED_BATH_OPTIONS = [1, 2, 3, 4, 5];
const AMENITY_OPTIONS: AmenityOption[] = ['Swimming Pool', 'Parking', 'Garden', 'Gym', 'Security', 'Elevator'];

const PREFERENCE_TOGGLES: { key: 'verifiedOnly' | 'furnished' | 'newProjects' | 'readyToMove'; label: string }[] = [
  { key: 'verifiedOnly', label: 'Verified only' },
  { key: 'furnished', label: 'Furnished' },
  { key: 'newProjects', label: 'New Projects' },
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

export function PropertyFilters({ filters, onChange, onApply, onReset }: PropertyFiltersProps) {
  const set = <K extends keyof ListingFiltersState>(key: K, value: ListingFiltersState[K]) =>
    onChange({ ...filters, [key]: value });

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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Property Type</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PROPERTY_TYPE_OPTIONS.map((type) => {
            const active = filters.propertyTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => set('propertyTypes', toggleInList(filters.propertyTypes, type))}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bedrooms</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {BED_BATH_OPTIONS.map((n) => {
            const active = filters.minBedrooms === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => set('minBedrooms', active ? null : n)}
                className={`flex h-9 w-12 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
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
        <div className="mt-3 flex flex-wrap gap-2">
          {BED_BATH_OPTIONS.map((n) => {
            const active = filters.minBathrooms === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => set('minBathrooms', active ? null : n)}
                className={`flex h-9 w-12 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
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

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amenities</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {AMENITY_OPTIONS.map((amenity) => {
            const active = filters.amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => set('amenities', toggleInList(filters.amenities, amenity))}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {amenity}
              </button>
            );
          })}
        </div>
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
