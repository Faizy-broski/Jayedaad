'use client';

import { ProjectsListView } from '@/components/projects/ProjectsListView';

export default function ProjectsPage() {
  return <ProjectsListView newHref="/admin/projects/new" detailHrefBase="/admin/projects" />;
}
