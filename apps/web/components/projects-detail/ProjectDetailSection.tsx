'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { developersRepository, projectsRepository, usePublicProjectDetailViewModel } from '@jayedaad/core';
import { ProjectDetail } from './ProjectDetail';
import { projectToCardData, projectToDisplayProject } from '@/lib/projectMappers';

interface ProjectDetailSectionProps {
  slug: string;
}

// GET /projects/:slug (usePublicProjectDetailViewModel) existed unused,
// same situation as the property detail page before this pass. Project's
// own `developer` field is only a DeveloperSummary (no bio), so the sidebar
// card needs a second real fetch — GET /developers/:slug — for the
// description/contact details it shows.
export function ProjectDetailSection({ slug }: ProjectDetailSectionProps) {
  const { project, isLoading, error } = usePublicProjectDetailViewModel(slug);

  const developerQuery = useQuery({
    queryKey: ['developers', project?.developer.slug],
    queryFn: () => developersRepository.findBySlug(project!.developer.slug),
    enabled: !!project,
  });

  // No findSimilar endpoint exists for projects (unlike listings) — same
  // city is the closest real proxy GET /projects supports.
  const similarQuery = useQuery({
    queryKey: ['projects', 'public', 'similar', project?.id, project?.city],
    queryFn: () => projectsRepository.searchPublic({ city: project!.city, pageSize: 5 }),
    enabled: !!project,
  });

  if (isLoading || (project && developerQuery.isLoading)) {
    return <div className="py-32 text-center text-sm text-muted-foreground">Loading project…</div>;
  }

  if (error || !project || !developerQuery.data) {
    return (
      <div className="flex flex-col items-center gap-3 py-32 text-center">
        <p className="text-sm text-muted-foreground">This project couldn&apos;t be found — it may have been removed.</p>
        <Link href="/developments" className="text-sm font-medium text-primary hover:underline">
          Back to all projects
        </Link>
      </div>
    );
  }

  const similar = (similarQuery.data?.items ?? [])
    .filter((item) => item.id !== project.id)
    .slice(0, 4)
    .map(projectToCardData);

  return <ProjectDetail project={projectToDisplayProject(project, developerQuery.data)} similar={similar} />;
}