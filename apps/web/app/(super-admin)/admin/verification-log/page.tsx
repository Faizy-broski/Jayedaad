'use client';

import { VerificationAuditLogEntry, useVerificationAuditLogViewModel } from '@jayedaad/core';
import { Badge, Table, TableColumn } from '@jayedaad/ui-web';

export default function VerificationLogPage() {
  const { entries, isLoading } = useVerificationAuditLogViewModel({ pageSize: 50 });

  const columns: TableColumn<VerificationAuditLogEntry>[] = [
    { key: 'date', header: 'Date', render: (e) => new Date(e.createdAt).toLocaleString() },
    { key: 'listing', header: 'Listing', render: (e) => e.listingId },
    { key: 'reviewer', header: 'Reviewer', render: (e) => e.reviewerId },
    {
      key: 'action',
      header: 'Action',
      render: (e) => (
        <Badge variant={e.action === 'approve' ? 'success' : e.action === 'reject' ? 'destructive' : 'default'}>{e.action}</Badge>
      ),
    },
    { key: 'note', header: 'Note', render: (e) => e.note ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Verification Audit Log</h1>
      <Table columns={columns} rows={entries} rowKey={(e) => e.id} isLoading={isLoading} emptyMessage="No entries yet." />
    </div>
  );
}
