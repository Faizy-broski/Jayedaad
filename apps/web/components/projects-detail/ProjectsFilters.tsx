'use client';

import { useQuery } from '@tanstack/react-query';
import { projectsRepository, type ProjectStatus } from '@jayedaad/core';
import { Select } from '@jayedaad/ui-web';

export interface ProjectFiltersState {
  city: string;
  propertyTypeSlug: string;
  status: ProjectStatus | '';
  minPrice: string;
  maxPrice: string;
  keyword: string;
}

export const DEFAULT_PROJECT_FILTERS: ProjectFiltersState = {
  city: '',
  propertyTypeSlug: '',
  status: '',
  minPrice: '',
  maxPrice: '',
  keyword: '',
};

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'ready', label: 'Ready' },
];

interface ProjectsFiltersProps {
  filters: ProjectFiltersState;
  onChange: (filters: ProjectFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
}

// City/Property Type options are real, live data — GET /projects/cities and
// GET /projects/categories, the same "Browse Projects by City/Category"
// counts confirmed real on Zameen's New Projects filter bar — not a fixed
// enum like the property listings page's PropertyFilters.
export function ProjectsFilters({ filters, onChange, onApply, onReset }: ProjectsFiltersProps) {
  const set = <K extends keyof ProjectFiltersState>(key: K, value: ProjectFiltersState[K]) =>
    onChange({ ...filters, [key]: value });

  const citiesQuery = useQuery({
    queryKey: ['projects', 'cities'],
    queryFn: projectsRepository.listCities,
    staleTime: 5 * 60_000,
  });
  const categoriesQuery = useQuery({
    queryKey: ['projects', 'categories'],
    queryFn: projectsRepository.listCategories,
    staleTime: 5 * 60_000,
  });

  return (
    <aside className="flex w-full flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">City</h3>
        <Select value={filters.city} onChange={(e) => set('city', e.target.value)} className="mt-3">
          <option value="">Any City</option>
          {(citiesQuery.data ?? []).map((c) => (
            <option key={c.city} value={c.city}>
              {c.city} ({c.count})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Property Type</h3>
        <Select value={filters.propertyTypeSlug} onChange={(e) => set('propertyTypeSlug', e.target.value)} className="mt-3">
          <option value="">Any Type</option>
          {(categoriesQuery.data ?? []).map((c) => (
            <option key={c.propertyType.slug} value={c.propertyType.slug}>
              {c.propertyType.label} ({c.count})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</h3>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const active = filters.status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => set('status', active ? '' : value)}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price Range (PKR)</h3>
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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keyword</h3>
        <input
          value={filters.keyword}
          onChange={(e) => set('keyword', e.target.value)}
          placeholder="e.g. Skyline"
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
        />
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
