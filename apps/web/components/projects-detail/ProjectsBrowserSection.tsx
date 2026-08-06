'use client';

import { useSearchParams } from 'next/navigation';
import { ProjectsBrowser } from './ProjectsBrowser';
import { DEFAULT_PROJECT_FILTERS } from './ProjectsFilters';
import { FALLBACK_PROJECT_CARDS } from '@/lib/projectMappers';

export function ProjectsBrowserSection() {
  const searchParams = useSearchParams();
  const city = searchParams.get('city') ?? '';

  return (
    <ProjectsBrowser initialFilters={{ ...DEFAULT_PROJECT_FILTERS, city }} fallbackProjects={FALLBACK_PROJECT_CARDS} />
  );
}
