'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  canDeleteProject,
  canEditProject,
  formatPrice,
  ProjectStatus,
  useAuthViewModel,
  useManageProjectsViewModel,
} from '@jayedaad/core';
import { Button, cn } from '@jayedaad/ui-web';
import { Building2, CheckCircle2, ImageOff, Layers, MapPin, Pencil, PlusCircle, Search, Trash2, XCircle } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import type { Project } from '@jayedaad/core';

const VERIFICATION_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  verified: { label: 'Verified', className: 'bg-primary/10 text-primary' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
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
// just because it was already approved. Restyled to match the rest of
// admin (Agencies/Agents/Plans/Users/CRM/Listings): gradient header,
// animated stat tiles, sliding status pills, animated card grid.
export function ProjectsListView({ newHref, detailHrefBase }: { newHref: string; detailHrefBase: string }) {
  const router = useRouter();
  const { role, user } = useAuthViewModel();
  const isSuperAdmin = role === 'super_admin';
  const { projects, isLoading, setVerificationStatus, remove } = useManageProjectsViewModel();
  const [activeTab, setActiveTab] = useState<'all' | ProjectStatus>('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const stats = useMemo(
    () => ({
      total: projects.length,
      verified: projects.filter((p) => p.verificationStatus === 'verified').length,
      pending: projects.filter((p) => p.verificationStatus === 'pending').length,
      unitTypes: projects.reduce((sum, p) => sum + p.unitTypeCount, 0),
    }),
    [projects],
  );

  // Client-side filter — the manage list is already fetched in full (no
  // server-side status filter/pagination on this endpoint), so filtering by
  // status here is just narrowing what's already in memory, same as how
  // this table has never paginated server-side.
  const visibleProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesTab = activeTab === 'all' || p.status === activeTab;
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.developer.name.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [projects, activeTab, search]);

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
              <span className="font-semibold text-foreground">{stats.total}</span> {stats.total === 1 ? 'project' : 'projects'} —{' '}
              <span className="font-semibold text-foreground">{stats.pending}</span> awaiting review.
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />)
        ) : (
          <>
            <StatTile index={0} icon={Building2} label="Total Projects" value={stats.total} sub="All statuses" />
            <StatTile index={1} icon={CheckCircle2} label="Verified" value={stats.verified} sub="Live on the platform" />
            <StatTile index={2} icon={XCircle} label="Pending" value={stats.pending} sub="Awaiting review" />
            <StatTile index={3} icon={Layers} label="Unit Types" value={stats.unitTypes} sub="Across all projects" />
          </>
        )}
      </div>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
            {STATUS_TABS.map((tab) => {
              const count = tab.id === 'all' ? projects.length : projects.filter((p) => p.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
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
                  <span className="relative">
                    {tab.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, or developer…"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </Reveal>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : visibleProjects.length === 0 ? (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No projects found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || activeTab !== 'all' ? 'Try a different search or filter.' : 'New projects will appear here once created.'}
            </p>
          </div>
        </Reveal>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {visibleProjects.map((project: Project, index) => {
              const badge = VERIFICATION_BADGE[project.verificationStatus];
              return (
                <motion.li
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.05 }}
                >
                  <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative aspect-[16/9] w-full shrink-0 bg-muted">
                      {project.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={project.coverImageUrl} alt={project.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-8 w-8" />
                        </div>
                      )}
                      <span className={cn('absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium', badge.className)}>
                        {badge.label}
                      </span>
                      <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium capitalize text-white">
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{project.developer.name}</p>

                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {project.area}, {project.city}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 shrink-0" />
                          {project.unitTypeCount} unit type{project.unitTypeCount === 1 ? '' : 's'}
                        </p>
                      </div>

                      {project.priceRange && (
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {formatPrice(project.priceRange.min)}
                          {project.priceRange.max !== project.priceRange.min && <> – {formatPrice(project.priceRange.max)}</>}
                        </p>
                      )}

                      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        {isSuperAdmin && project.verificationStatus === 'pending' && (
                          <>
                            <Button size="sm" className="text-xs" onClick={() => handleVerify(project.id, 'verified')} disabled={setVerificationStatus.isPending}>
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleVerify(project.id, 'rejected')}
                              disabled={setVerificationStatus.isPending}
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
                          <Button size="sm" variant="outline" className="ml-auto text-destructive" onClick={() => handleDelete(project.id, project.name)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

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

function StatTile({
  index,
  icon: Icon,
  label,
  value,
  sub,
}: {
  index: number;
  icon: typeof Building2;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.06 }}>
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">{value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}
