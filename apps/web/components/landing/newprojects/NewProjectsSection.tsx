'use client';

import { useProjectsViewModel } from '@jayedaad/core';
import { NewProjects } from './NewProjects';
import { FALLBACK_PROJECT_CARDS, projectToCardData } from '@/lib/projectMappers';

// Real GET /projects, sortBy=newest — same data source as the /developments
// browse page, just the newest 8. Replaces the old NewlyStaged property
// carousel on the homepage.
export function NewProjectsSection() {
  const { projects, isLoading } = useProjectsViewModel({ sortBy: 'newest', page: 1, pageSize: 8 });
  const cards = projects.map(projectToCardData);
  const showLive = !isLoading && cards.length > 0;

  return <NewProjects projects={showLive ? cards : FALLBACK_PROJECT_CARDS} />;
}
