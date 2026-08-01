'use client';

import { ProjectsListView } from '@/components/projects/ProjectsListView';

export default function ProjectsPage() {
  return <ProjectsListView newHref="/projects/new" detailHrefBase="/projects" />;
}
