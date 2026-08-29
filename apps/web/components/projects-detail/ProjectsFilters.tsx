'use client';

import { useQuery } from '@tanstack/react-query';
import { PAKISTAN_CITIES, developersRepository, projectsRepository, type AreaUnit, type ProjectStatus } from '@jayedaad/core';
import { Select } from '@jayedaad/ui-web';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';
import { AREA_UNITS, areaUnitLabel } from '@/lib/areaOptions';

export interface ProjectFiltersState {
  city: string;
  area: string;
  propertyTypeSlug: string;
  status: ProjectStatus | '';
  minPrice: string;
  maxPrice: string;
  minAreaValue: string;
  maxAreaValue: string;
  areaUnit: AreaUnit;
  developerSlug: string;
  keyword: string;
}

export const DEFAULT_PROJECT_FILTERS: ProjectFiltersState = {
  city: '',
  area: '',
  propertyTypeSlug: '',
  status: '',
  minPrice: '',
  maxPrice: '',
  minAreaValue: '',
  maxAreaValue: '',
  areaUnit: 'marla',
  developerSlug: '',
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

// Property Type options are real, live data — GET /projects/categories, the
// same "Browse Projects by Category" counts confirmed real on Zameen's New
// Projects filter bar. City now uses the same full static PAKISTAN_CITIES
// list every other City dropdown in the app uses — the previous live
// GET /projects/cities source only ever showed cities that already had a
// project, sparse on a fresh dataset.
export function ProjectsFilters({ filters, onChange, onApply, onReset }: ProjectsFiltersProps) {
  const set = <K extends keyof ProjectFiltersState>(key: K, value: ProjectFiltersState[K]) =>
    onChange({ ...filters, [key]: value });

  const categoriesQuery = useQuery({
    queryKey: ['projects', 'categories'],
    queryFn: projectsRepository.listCategories,
    staleTime: 5 * 60_000,
  });
  const developersQuery = useQuery({
    queryKey: ['developers', 'all'],
    // Called with no filters -> the unpaginated array branch of the
    // dual-mode endpoint (see developers.repository.ts::list).
    queryFn: () => developersRepository.list(),
    select: (data) => (Array.isArray(data) ? data : data.items),
    staleTime: 5 * 60_000,
  });

  return (
    <aside className="flex w-full flex-col gap-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">City</h3>
        <Select value={filters.city} onChange={(e) => set('city', e.target.value)} className="mt-3">
          <option value="">Any City</option>
          {PAKISTAN_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Area / Location</h3>
        <PlacesAutocompleteInput
          value={filters.area}
          onChange={(v) => set('area', v)}
          placeholder="e.g. Bahria Town, DHA"
          className="mt-3 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
        />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Property Type</h3>
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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</h3>
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
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price Range (PKR)</h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => set('minPrice', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <span className="shrink-0 text-muted-foreground">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => set('maxPrice', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Area Range</h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.minAreaValue}
            onChange={(e) => set('minAreaValue', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <span className="shrink-0 text-muted-foreground">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.maxAreaValue}
            onChange={(e) => set('maxAreaValue', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <Select value={filters.areaUnit} onChange={(e) => set('areaUnit', e.target.value as AreaUnit)} className="w-28 shrink-0">
            {AREA_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {areaUnitLabel(unit)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Developer</h3>
        <Select value={filters.developerSlug} onChange={(e) => set('developerSlug', e.target.value)} className="mt-3">
          <option value="">Any Developer</option>
          {(developersQuery.data ?? []).map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Keyword</h3>
        <input
          value={filters.keyword}
          onChange={(e) => set('keyword', e.target.value)}
          placeholder="e.g. Skyline"
          className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40"
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