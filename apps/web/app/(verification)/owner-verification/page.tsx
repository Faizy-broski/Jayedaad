'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { PendingOwnerVerification, useAdminOwnersViewModel } from '@jayedaad/core';
import { Badge, Button, Pagination, Table, TableColumn } from '@jayedaad/ui-web';
import { CheckCircle2, XCircle } from 'lucide-react';

const PAGE_SIZE = 20;

// Owner identity-verification queue — restyled onto the shared
// Table/Pagination primitives, same structure as the super_admin-only
// admin/owners/page.tsx twin (which this mirrors, same as
// agent-verification/page.tsx mirrors admin/agents/page.tsx). The
// underlying endpoint (GET /owners/pending-verification) isn't server-side
// paginated, so this paginates client-side over the full pending list.
export default function OwnerVerificationQueuePage() {
  const { owners, isLoading, setVerificationStatus } = useAdminOwnersViewModel();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(owners.length / PAGE_SIZE));
  const pageRows = owners.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function runAction(userId: string, status: 'verified' | 'rejected') {
    const reason = status === 'rejected' ? (prompt('Reason for rejection (optional):') ?? undefined) : undefined;
    setVerificationStatus.mutate(
      { userId, status, reason },
      {
        onSuccess: () => toast.success(status === 'verified' ? 'Owner approved.' : 'Owner rejected.'),
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  const columns: TableColumn<PendingOwnerVerification>[] = [
    { key: 'name', header: 'Owner', render: (o) => o.displayName ?? 'Unnamed applicant' },
    { key: 'email', header: 'Email', render: (o) => o.email ?? '—' },
    {
      key: 'documents',
      header: 'Documents',
      render: (o) => (
        <span>
          {o.documents.uploaded.length} / {o.documents.required.length}
          {o.documents.missing.length > 0 && <span className="text-amber-600"> — missing {o.documents.missing.length}</span>}
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
      render: (o) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-primary"
            disabled={setVerificationStatus.isPending}
            onClick={() => runAction(o.userId, 'verified')}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            disabled={setVerificationStatus.isPending}
            onClick={() => runAction(o.userId, 'rejected')}
          >
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
        <h1 className="text-2xl font-bold text-foreground">Owner Applications</h1>
        <p className="text-muted-foreground">One-time identity checks (CNIC + selfie) awaiting review.</p>
      </div>

      <Table columns={columns} rows={pageRows} rowKey={(o) => o.userId} isLoading={isLoading} emptyMessage="No pending applications." />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
