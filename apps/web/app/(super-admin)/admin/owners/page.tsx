'use client';

import toast from 'react-hot-toast';
import { PendingOwnerVerification, useAdminOwnersViewModel } from '@jayedaad/core';
import { Badge, Button, Table, TableColumn } from '@jayedaad/ui-web';

// Staff review queue for the one-time owner identity verification
// (CNIC front/back + selfie) — mirrors admin/agents/page.tsx's Verify/Reject
// action exactly. Only ever shows still-'pending' rows, same scope as
// GET /owners/pending-verification server-side.
export default function OwnersPage() {
  const { owners, isLoading, setVerificationStatus } = useAdminOwnersViewModel();

  function handleVerify(userId: string, status: 'verified' | 'rejected') {
    setVerificationStatus.mutate(
      { userId, status },
      {
        onSuccess: () => toast.success(`Owner ${status}.`),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  const columns: TableColumn<PendingOwnerVerification>[] = [
    { key: 'name', header: 'Owner', render: (o) => o.displayName ?? '—' },
    { key: 'email', header: 'Email', render: (o) => o.email ?? '—' },
    {
      key: 'documents',
      header: 'Documents',
      render: (o) => `${o.documents.uploaded.length} / ${o.documents.required.length}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <Badge variant="warning">{o.status}</Badge>,
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
            disabled={o.documents.missing.length > 0}
            onClick={() => handleVerify(o.userId, 'verified')}
          >
            Verify
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleVerify(o.userId, 'rejected')}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Owner Verification</h1>
        <p className="text-muted-foreground">One-time identity checks (CNIC + selfie) awaiting review.</p>
      </div>
      <Table
        columns={columns}
        rows={owners}
        rowKey={(o) => o.userId}
        isLoading={isLoading}
        emptyMessage="No owners pending verification."
      />
    </div>
  );
}
