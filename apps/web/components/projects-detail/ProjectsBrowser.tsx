'use client';

import { useState } from 'react';
import { useProjectsViewModel, type ProjectStatus } from '@jayedaad/core';
import { Select } from '@jayedaad/ui-web';
import { ProjectsFilters, DEFAULT_PROJECT_FILTERS, type ProjectFiltersState } from './ProjectsFilters';
import { ProjectCard } from './ProjectCard';
import { Pagination } from '@/components/listings/Pagination';
import { ConciergeBanner } from '@/components/listings/ConciergeBanner';
import { projectToCardData } from '@/lib/projectMappers';

const SORT_OPTIONS = ['Newest', 'Price: Low to High', 'Price: High to Low'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];
const SORT_TO_API: Record<SortOption, 'newest' | 'price_asc' | 'price_desc'> = {
  Newest: 'newest',
  'Price: Low to High': 'price_asc',
  'Price: High to Low': 'price_desc',
};

const PAGE_SIZE = 9;

interface ProjectsBrowserProps {
  initialFilters?: Partial<ProjectFiltersState>;
}

// Unlike ListingsBrowser (which over-fetches once and re-filters a fixed
// pool client-side), GET /projects already paginates/filters server-side —
// so Apply just updates the real query filters instead of a local array
// filter, and Pagination pages the actual API, not a client-side slice.
export function ProjectsBrowser({ initialFilters }: ProjectsBrowserProps) {
  const seed = { ...DEFAULT_PROJECT_FILTERS, ...initialFilters };
  const [draftFilters, setDraftFilters] = useState<ProjectFiltersState>(seed);
  const [appliedFilters, setAppliedFilters] = useState<ProjectFiltersState>(seed);
  const [sort, setSort] = useState<SortOption>('Newest');
  const [page, setPage] = useState(1);

  const { projects, total, isLoading } = useProjectsViewModel({
    city: appliedFilters.city || undefined,
    area: appliedFilters.area || undefined,
    propertyTypeSlug: appliedFilters.propertyTypeSlug || undefined,
    status: (appliedFilters.status || undefined) as ProjectStatus | undefined,
    minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
    maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
    minAreaValue: appliedFilters.minAreaValue ? Number(appliedFilters.minAreaValue) : undefined,
    maxAreaValue: appliedFilters.maxAreaValue ? Number(appliedFilters.maxAreaValue) : undefined,
    areaUnit: appliedFilters.areaUnit,
    developerSlug: appliedFilters.developerSlug || undefined,
    keyword: appliedFilters.keyword || undefined,
    sortBy: SORT_TO_API[sort],
    page,
    pageSize: PAGE_SIZE,
  });

  const displayed = projects.map(projectToCardData);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
  };

  const handleReset = () => {
    setDraftFilters(DEFAULT_PROJECT_FILTERS);
    setAppliedFilters(DEFAULT_PROJECT_FILTERS);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <ProjectsFilters filters={draftFilters} onChange={setDraftFilters} onApply={handleApply} onReset={handleReset} />

        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-heading-gradient">
                {total} New Projects
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Verified developments from Pakistan&apos;s leading developers.
              </p>
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

          <div className="mt-6">
            {isLoading ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Loading projects…</p>
            ) : displayed.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                No projects match your filters. Try widening your search.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {displayed.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
            {!isLoading && total > 0 && <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />}
          </div>

          <div className="mt-10">
            <ConciergeBanner />
          </div>
        </div>
      </div>
    </div>
  );
}