'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Listing, ListingStatus, formatPrice, useAdminListingsViewModel } from '@jayedaad/core';
import { Badge, Button, Select, Table, TableColumn, Tabs } from '@jayedaad/ui-web';

const STATUS_TABS: { id: ListingStatus; label: string }[] = [
  { id: 'pending_verification', label: 'Pending' },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'expired', label: 'Expired' },
  { id: 'downgraded', label: 'Downgraded' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'deleted', label: 'Deleted' },
];

const OVERRIDE_STATUSES: ListingStatus[] = [
  'pending_verification',
  'verified',
  'rejected',
  'expired',
  'downgraded',
  'inactive',
  'deleted',
];

// Super Admin admin-wide listings — unscoped GET /listings/mine (every
// listing on the platform), plus a direct status-override action distinct
// from the verification queue's approve/reject flow.
export default function AdminListingsPage() {
  const [status, setStatus] = useState<ListingStatus>('pending_verification');
  const { listings, isLoading, statusCounts, setStatus: setListingStatus } = useAdminListingsViewModel({
    status,
    page: 1,
    pageSize: 20,
  });

  function handleOverride(listingId: string, next: ListingStatus) {
    setListingStatus.mutate(
      { listingId, status: next },
      {
        onSuccess: () => toast.success('Listing status updated.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  const columns: TableColumn<Listing>[] = [
    { key: 'title', header: 'Title', render: (l) => l.title },
    { key: 'agent', header: 'Agent', render: (l) => l.agent?.displayName ?? 'Owner-listed' },
    { key: 'city', header: 'City', render: (l) => l.city },
    { key: 'price', header: 'Price', render: (l) => formatPrice(Number(l.price)) },
    { key: 'status', header: 'Status', render: (l) => <Badge>{l.status}</Badge> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (l) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/listings/${l.id}`}>
            <Button size="sm" variant="outline">
              View
            </Button>
          </Link>
          <Select
            className="h-8 w-44 py-0 text-xs"
            value=""
            onChange={(e) => handleOverride(l.id, e.target.value as ListingStatus)}
          >
            <option value="">Change status…</option>
            {OVERRIDE_STATUSES.filter((s) => s !== l.status).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Listings — All Agents</h1>

      <Tabs
        tabs={STATUS_TABS.map((t) => ({ id: t.id, label: `${t.label} (${statusCounts[t.id] ?? 0})` }))}
        activeId={status}
        onChange={(id) => setStatus(id as ListingStatus)}
      />

      <Table columns={columns} rows={listings} rowKey={(l) => l.id} isLoading={isLoading} emptyMessage="No listings in this status." />
    </div>
  );
}
