'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatPrice, Listing, listingsRepository, ListingDocument, ListingDocumentType, useVerificationQueueViewModel } from '@jayedaad/core';
import { Badge, Button, Modal, Pagination, Table, TableColumn } from '@jayedaad/ui-web';
import { Building2, CheckCircle2, FileCheck2, ImageOff, User, XCircle } from 'lucide-react';

const LISTING_DOCUMENT_TYPES: { type: ListingDocumentType; label: string }[] = [
  { type: 'ownership_proof', label: 'Ownership Proof' },
  { type: 'utility_bill', label: 'Utility Bill' },
];

const PAGE_SIZE = 20;

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

// Verification Staff's primary screen [Dev Instr §2.2]. Every action here
// writes an audit log entry server-side (reviewer, timestamp, action, listing).
// Restyled onto the shared Table/Pagination primitives — same structure as
// the super_admin equivalents (admin/agents/page.tsx, admin/owners/page.tsx:
// Table + column-driven rows, a reason prompt on Reject, a Documents modal
// on demand) instead of a hand-rolled card list, so this reads as the same
// admin product rather than a separately-styled screen.
export default function VerificationQueuePage() {
  const [page, setPage] = useState(1);
  const { queue, total, isLoading, isError, act } = useVerificationQueueViewModel({ page, pageSize: PAGE_SIZE });
  const [docsModalListing, setDocsModalListing] = useState<Listing | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function runAction(listingId: string, action: 'approve' | 'reject') {
    // Same optional-reason-on-reject convention as admin/agents/page.tsx
    // and admin/owners/page.tsx's handleVerify.
    const note = action === 'reject' ? (prompt('Reason for rejection (optional):') ?? undefined) : undefined;
    act.mutate(
      { listingId, action, note },
      {
        onSuccess: () => toast.success(action === 'approve' ? 'Listing approved.' : 'Listing rejected.'),
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  const columns: TableColumn<Listing>[] = [
    {
      key: 'listing',
      header: 'Listing',
      render: (listing) => {
        const sortedMedia = [...listing.media].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
        const cover = sortedMedia[0];
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground/40">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover.compressedUrl ?? cover.url} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <a
                href={`/admin/listings/${listing.id}`}
                target="_blank"
                rel="noreferrer"
                className="block max-w-[220px] truncate text-sm font-medium text-foreground hover:text-primary"
              >
                {listing.title}
              </a>
              <p className="truncate text-xs text-muted-foreground">
                {listing.area}, {listing.city}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'agent',
      header: 'Listed By',
      render: (listing) => (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
            {listing.agent?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.agent.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : listing.agent?.displayName ? (
              initials(listing.agent.displayName)
            ) : (
              <User className="h-3 w-3" />
            )}
          </span>
          <span className="text-foreground">{listing.agent?.displayName ?? 'Owner-listed'}</span>
          {listing.agent?.agency && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {listing.agent.agency.name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (listing) => <span className="font-medium text-foreground">{formatPrice(Number(listing.price))}</span>,
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
      render: (listing) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="text-primary" disabled={act.isPending} onClick={() => runAction(listing.id, 'approve')}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" disabled={act.isPending} onClick={() => runAction(listing.id, 'reject')}>
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDocsModalListing(listing)}>
            <FileCheck2 className="mr-1 h-3.5 w-3.5" />
            Documents
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verification Queue</h1>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> {total === 1 ? 'listing' : 'listings'} awaiting review.
        </p>
      </div>

      {isError ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-destructive/40 py-16 text-center">
          <ImageOff className="mb-3 h-10 w-10 text-destructive/50" />
          <h3 className="text-sm font-semibold text-foreground">Couldn&apos;t load the verification queue</h3>
          <p className="mt-1 text-xs text-muted-foreground">Please try again in a moment.</p>
        </div>
      ) : (
        <Table columns={columns} rows={queue} rowKey={(l) => l.id} isLoading={isLoading} emptyMessage="Nothing pending review." />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={!!docsModalListing} onClose={() => setDocsModalListing(null)} title={`Documents — ${docsModalListing?.title ?? ''}`}>
        {docsModalListing && <ListingDocumentsSection listingId={docsModalListing.id} />}
      </Modal>
    </div>
  );
}

function ListingDocumentsSection({ listingId }: { listingId: string }) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['verification', 'listing-documents', listingId],
    queryFn: () => listingsRepository.listDocuments(listingId),
  });

  // listDocuments returns every historical row (newest first) since replace
  // inserts rather than overwrites — take the first (newest) row per type,
  // not `new Map(entries)`'s last-one-wins, which would keep the oldest.
  const docByType = new Map<ListingDocumentType, ListingDocument>();
  for (const d of documents ?? []) {
    if (!docByType.has(d.documentType)) docByType.set(d.documentType, d);
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      ) : (
        LISTING_DOCUMENT_TYPES.map((doc) => {
          const found = docByType.get(doc.type);
          return (
            <div key={doc.type} className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground">{doc.label}</span>
              {found ? (
                <a href={found.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
                  View
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Not uploaded</span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
