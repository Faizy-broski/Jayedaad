'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { canDeleteProject, canEditProject, ProjectStatus, useAuthViewModel, useManageProjectsViewModel } from '@jayedaad/core';
import { Badge, Button, Table, TableColumn, Tabs } from '@jayedaad/ui-web';
import type { Project } from '@jayedaad/core';

const VERIFICATION_BADGE_VARIANT = {
  pending: 'warning',
  verified: 'success',
  rejected: 'destructive',
  draft: 'default',
} as const;

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
// just because it was already approved.
export function ProjectsListView({ newHref, detailHrefBase }: { newHref: string; detailHrefBase: string }) {
  const router = useRouter();
  const { role, user } = useAuthViewModel();
  const isSuperAdmin = role === 'super_admin';
  const { projects, isLoading, setVerificationStatus, remove } = useManageProjectsViewModel();
  const [activeTab, setActiveTab] = useState<'all' | ProjectStatus>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Client-side filter — the manage list is already fetched in full (no
  // server-side status filter/pagination on this endpoint), so filtering by
  // status here is just narrowing what's already in memory, same as how
  // this table has never paginated server-side.
  const visibleProjects = activeTab === 'all' ? projects : projects.filter((p) => p.status === activeTab);

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
    { key: 'name', header: 'Name', render: (p) => p.name },
    { key: 'developer', header: 'Developer', render: (p) => p.developer.name },
    { key: 'city', header: 'City', render: (p) => p.city },
    { key: 'status', header: 'Status', render: (p) => <Badge>{p.status.replace('_', ' ')}</Badge> },
    {
      key: 'verification',
      header: 'Verification',
      render: (p) => <Badge variant={VERIFICATION_BADGE_VARIANT[p.verificationStatus]}>{p.verificationStatus}</Badge>,
    },
    { key: 'unitTypes', header: 'Unit Types', render: (p) => p.unitTypeCount },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex flex-wrap justify-end gap-2">
          {isSuperAdmin && p.verificationStatus === 'pending' && (
            <>
              <Button size="sm" onClick={() => handleVerify(p.id, 'verified')} disabled={setVerificationStatus.isPending}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => handleVerify(p.id, 'rejected')}
                disabled={setVerificationStatus.isPending}
              >
                Reject
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => router.push(`${detailHrefBase}/${p.id}`)}>
            {canEditProject(p, role, user?.id) ? 'Edit' : 'View'}
          </Button>
          {canDeleteProject(p, role, user?.id) && (
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(p.id, p.name)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button onClick={() => router.push(newHref)}>New Project</Button>
      </div>

      <Tabs
        tabs={STATUS_TABS.map((t) => ({
          id: t.id,
          label: `${t.label} (${t.id === 'all' ? projects.length : projects.filter((p) => p.status === t.id).length})`,
        }))}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'all' | ProjectStatus)}
      />

      <Table
        columns={columns}
        rows={visibleProjects}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        emptyMessage={activeTab === 'all' ? 'No projects yet.' : `No ${activeTab.replace('_', ' ')} projects.`}
      />

      {deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setDeleteTarget(null)}
          >
            <div className="w-80 rounded-lg border border-border bg-background p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm">
                Delete <span className="font-semibold">{deleteTarget.name}</span>? This can&apos;t be undone.
              </p>
              <div className="mt-3 flex justify-end gap-2">
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
