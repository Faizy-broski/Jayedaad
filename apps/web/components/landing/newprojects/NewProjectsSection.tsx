'use client';

import { useProjectsViewModel } from '@jayedaad/core';
import { NewProjects } from './NewProjects';
import { projectToCardData } from '@/lib/projectMappers';

// Real GET /projects, sortBy=newest — same data source as the /developments
// browse page, just the newest 8. Replaces the old NewlyStaged property
// carousel on the homepage.
export function NewProjectsSection() {
  const { projects } = useProjectsViewModel({ sortBy: 'newest', page: 1, pageSize: 8 });
  return <NewProjects projects={projects.map(projectToCardData)} />;
}