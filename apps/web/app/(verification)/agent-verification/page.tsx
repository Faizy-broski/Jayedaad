'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { PendingAgentApplication, useAgentVerificationQueueViewModel } from '@jayedaad/core';
import { Badge, Button, Pagination, Table, TableColumn } from '@jayedaad/ui-web';
import { CheckCircle2, XCircle } from 'lucide-react';

const PAGE_SIZE = 20;

// Staff review queue for self-service agent applications
// (apps/web/app/(buyer)/become-an-agent/page.tsx). Restyled onto the shared
// Table/Pagination primitives — same structure as the super_admin
// equivalents (admin/agents/page.tsx, admin/owners/page.tsx). The
// underlying endpoint (GET /agents/pending-verification) isn't server-side
// paginated, so this paginates client-side over the full pending list —
// still gives the same "Page X of Y" UI the super admin tables use, just
// sliced locally instead of driven by a page/pageSize query param.
export default function AgentVerificationQueuePage() {
  const { queue, isLoading, isError, act } = useAgentVerificationQueueViewModel();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(queue.length / PAGE_SIZE));
  const pageRows = queue.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function runAction(agentId: string, status: 'verified' | 'rejected') {
    // Same optional-reason-on-reject convention as admin/agents/page.tsx.
    const reason = status === 'rejected' ? (prompt('Reason for rejection (optional):') ?? undefined) : undefined;
    act.mutate(
      { agentId, status, reason },
      {
        onSuccess: () => toast.success(status === 'verified' ? 'Agent approved.' : 'Agent rejected.'),
        // Surface the API's real 400 message (e.g. which required
        // documents are still missing) instead of a generic one — same
        // convention as admin/agents/page.tsx's handleVerify.
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  const columns: TableColumn<PendingAgentApplication>[] = [
    { key: 'name', header: 'Applicant', render: (a) => a.displayName ?? 'Unnamed applicant' },
    {
      key: 'contact',
      header: 'Contact',
      render: (a) => (
        <span className="text-muted-foreground">
          {a.phone ?? '—'} · {a.city ?? '—'}
        </span>
      ),
    },
    {
      key: 'documents',
      header: 'Documents',
      render: (a) =>
        a.documents.uploaded.length === 0 ? (
          <span className="text-muted-foreground">None uploaded yet</span>
        ) : (
          <span>
            {a.documents.uploaded.length} / {a.documents.required.length}
            {a.documents.missing.length > 0 && <span className="text-amber-600"> — missing {a.documents.missing.length}</span>}
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <Badge variant="warning">pending</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="text-primary" disabled={act.isPending} onClick={() => runAction(a.id, 'verified')}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" disabled={act.isPending} onClick={() => runAction(a.id, 'rejected')}>
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agent Applications</h1>
        <p className="text-muted-foreground">Self-service agent sign-ups awaiting review.</p>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">Couldn&apos;t load applications — please try again in a moment.</p>
      ) : (
        <Table columns={columns} rows={pageRows} rowKey={(a) => a.id} isLoading={isLoading} emptyMessage="No pending applications." />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
