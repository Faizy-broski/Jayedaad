'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  canDeleteProject,
  canEditProject,
  formatPrice,
  Project,
  ProjectStatus,
  useAuthViewModel,
  useManageProjectsViewModel,
} from '@jayedaad/core';
import { Badge, Button, cn, Input, Pagination, Table, TableColumn } from '@jayedaad/ui-web';
import {
  Building2,
  CheckCircle2,
  ImageOff,
  Layers,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const PAGE_SIZE = 20;

const VERIFICATION_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  pending: 'warning',
  verified: 'success',
  rejected: 'destructive',
  draft: 'default',
};

const STATUS_TABS: { id: 'all' | ProjectStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'planned', label: 'Planned' },
  { id: 'under_construction', label: 'Under Construction' },
  { id: 'ready', label: 'Ready' },
];

// Shared between the Super Admin (/admin/projects) and agent-portal
// (/projects) routes — both roles are allowed to create projects per
// services/api/src/projects/projects.controller.ts's @Roles('agent',
// 'super_admin'), so this view is parameterized by newHref/detailHrefBase
// rather than duplicated per route group. Approve/Reject are super_admin-
// only. Edit/Delete are self-scoped — an agent can edit or delete their own
// project (see PATCH/DELETE /projects/:id's ownership checks), a Super
// Admin can edit/delete any; deleting is further restricted to before
// approval for an agent (once verified/live, only a Super Admin can remove
// it). Editing a verified/rejected project resets it to 'pending' —
// real-time changes always go back to Super Admin for re-review, same rule
// listings already have — so an agent isn't locked out of their project
// just because it was already approved. Table + real server-side
// pagination (GET /projects/manage already supports page/pageSize/status/
// keyword — see ProjectsRepository.findPublic) instead of an unbounded
// card grid, same reasoning as admin/blog/page.tsx.
export function ProjectsListView({ newHref, detailHrefBase }: { newHref: string; detailHrefBase: string }) {
  const router = useRouter();
  const { role, user } = useAuthViewModel();
  const isSuperAdmin = role === 'super_admin';
  const [activeTab, setActiveTab] = useState<'all' | ProjectStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { projects, total, isLoading, setVerificationStatus, remove } = useManageProjectsViewModel({
    status: activeTab === 'all' ? undefined : activeTab,
    keyword: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleTabChange(tab: 'all' | ProjectStatus) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleVerify(id: string, status: 'verified' | 'rejected') {
    setVerificationStatus.mutate(
      { id, input: { status } },
      {
        onSuccess: () => toast.success(status === 'verified' ? 'Project approved.' : 'Project rejected.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  // A styled confirm dialog rather than window.confirm(), so it matches the
  // app's own theme instead of the browser's native dialog chrome. Rendered
  // via a portal straight to document.body (see the createPortal call at
  // the bottom of this component) rather than through react-hot-toast's
  // toast.custom() — the Toaster's own positioned wrapper applies a CSS
  // transform for its enter/exit animation, and a transform on an ancestor
  // makes `position: fixed` descendants fixed relative to THAT ancestor
  // instead of the viewport, which pinned the dialog into whichever corner
  // the Toaster is configured for (top-right) instead of true screen
  // center. Going straight to document.body sidesteps that entirely.
  function handleDelete(id: string, name: string) {
    setDeleteTarget({ id, name });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    remove.mutate(id, {
      onSuccess: () => toast.success('Project deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  const columns: TableColumn<Project>[] = [
    {
      key: 'project',
      header: 'Project',
      render: (project) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground/40">
            {project.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.coverImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageOff className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'developer',
      header: 'Developer',
      render: (project) => <span className="truncate text-sm text-muted-foreground">{project.developer.name}</span>,
    },
    { key: 'location', header: 'Location', render: (project) => `${project.area}, ${project.city}` },
    {
      key: 'status',
      header: 'Status',
      render: (project) => <span className="capitalize">{project.status.replace('_', ' ')}</span>,
    },
    {
      key: 'unitTypes',
      header: 'Unit Types',
      render: (project) => `${project.unitTypeCount} type${project.unitTypeCount === 1 ? '' : 's'}`,
    },
    {
      key: 'price',
      header: 'Price Range',
      render: (project) =>
        project.priceRange ? (
          <>
            {formatPrice(project.priceRange.min)}
            {project.priceRange.max !== project.priceRange.min && <> – {formatPrice(project.priceRange.max)}</>}
          </>
        ) : (
          '—'
        ),
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (project) => <Badge variant={VERIFICATION_VARIANT[project.verificationStatus]}>{project.verificationStatus}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (project) => (
        <div className="flex justify-end gap-2">
          {isSuperAdmin && (
            <>
              <Button
                size="sm"
                onClick={() => handleVerify(project.id, 'verified')}
                disabled={setVerificationStatus.isPending || project.verificationStatus === 'verified'}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => handleVerify(project.id, 'rejected')}
                disabled={setVerificationStatus.isPending || project.verificationStatus === 'rejected'}
              >
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => router.push(`${detailHrefBase}/${project.id}`)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            {canEditProject(project, role, user?.id) ? 'Edit' : 'View'}
          </Button>
          {canDeleteProject(project, role, user?.id) && (
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(project.id, project.name)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Project management
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Projects</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{total}</span> {total === 1 ? 'project' : 'projects'} total.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(newHref)}
            className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            New Project
          </button>
        </div>
      </Reveal>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'relative shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="projectStatusTab"
                    className="bg-heading-gradient absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name, city, or developer…"
              className="pl-9"
            />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <Table
          columns={columns}
          rows={projects}
          rowKey={(project) => project.id}
          isLoading={isLoading}
          emptyMessage={search || activeTab !== 'all' ? 'No projects match your search or filter.' : 'New projects will appear here once created.'}
        />
      </Reveal>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setDeleteTarget(null)}
          >
            <div
              className="w-80 animate-modal-in rounded-2xl bg-background p-5 shadow-2xl ring-1 ring-black/5"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-foreground">
                Delete <span className="font-semibold">{deleteTarget.name}</span>? This can&apos;t be undone.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={confirmDelete}>
                  Delete
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
