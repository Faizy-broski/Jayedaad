'use client';

import { useParams } from 'next/navigation';
import { useAuthViewModel, useProjectDetailViewModel } from '@jayedaad/core';
import { ProjectForm } from '@/components/projects/ProjectForm';

// Editable for the agent who created this project (self-scoped, same as
// PATCH /projects/:id's ownership check server-side), read-only otherwise —
// e.g. viewing another agent's project. super_admin never reaches this
// route (middleware routes them through /admin/projects/[id] instead).
export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuthViewModel();
  const { project, isLoading } = useProjectDetailViewModel(params.id);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const canEdit = !!project && !!user && project.createdBy === user.id;

  return <ProjectForm projectId={params.id} successHref="/projects" readOnly={!canEdit} />;
}
