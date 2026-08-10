'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatPrice, listingsRepository, ListingDocument, ListingDocumentType, useVerificationQueueViewModel } from '@jayedaad/core';
import { Button, Pagination } from '@jayedaad/ui-web';
import { Building2, ChevronDown, ChevronUp, ImageOff, MapPin, User } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

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
// Previously this rendered almost nothing (title + Approve/Reject) because
// the queue endpoint returned an unmapped, unjoined row (see
// VerificationRepository.listQueue()'s fix) — now that it returns full
// Listing objects, this shows a real thumbnail/address/agent per row plus
// an expandable Documents section (ownership_proof/utility_bill), so a
// reviewer isn't approving/rejecting blind.
export default function VerificationQueuePage() {
  const [page, setPage] = useState(1);
  const { queue, total, isLoading, act } = useVerificationQueueViewModel({ page, pageSize: PAGE_SIZE });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const runAction = (listingId: string, action: 'approve' | 'reject') => {
    const note = notes[listingId]?.trim() || undefined;
    act.mutate(
      { listingId, action, note },
      {
        onSuccess: () => {
          toast.success(action === 'approve' ? 'Listing approved.' : 'Listing rejected.');
          setNotes((prev) => ({ ...prev, [listingId]: '' }));
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Reveal>
        <h1 className="mb-1 text-2xl font-bold text-foreground">Verification Queue</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> {total === 1 ? 'listing' : 'listings'} awaiting review.
        </p>
      </Reveal>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <ImageOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">Nothing pending review</h3>
          </div>
        </Reveal>
      ) : (
        <ul className="space-y-4">
          {queue.map((listing, index) => {
            const sortedMedia = [...listing.media].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
            const cover = sortedMedia[0];
            const isExpanded = expandedId === listing.id;

            return (
              <Reveal key={listing.id}>
                <li className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-start gap-4">
                    <span className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground/40">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover.compressedUrl ?? cover.url} alt={listing.title} className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff className="h-6 w-6" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/admin/listings/${listing.id}`} target="_blank" className="truncate text-sm font-semibold text-foreground hover:text-primary">
                            {listing.title}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {listing.area}, {listing.city}
                            <span className="capitalize">· {listing.propertyType.label} · {listing.purpose}</span>
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-foreground">{formatPrice(Number(listing.price))}</p>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
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
                        {listing.agent?.displayName ?? 'Owner-listed'}
                        {listing.agent?.agency && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {listing.agent.agency.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={notes[listing.id] ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                    placeholder="Optional note (e.g. reason for rejection)…"
                    rows={2}
                    className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button onClick={() => runAction(listing.id, 'approve')} disabled={act.isPending}>
                      Approve
                    </Button>
                    <Button variant="outline" className="text-destructive" onClick={() => runAction(listing.id, 'reject')} disabled={act.isPending}>
                      Reject
                    </Button>
                    <Button variant="outline" onClick={() => setExpandedId((cur) => (cur === listing.id ? null : listing.id))}>
                      {isExpanded ? (
                        <>
                          <ChevronUp className="mr-1 h-3.5 w-3.5" />
                          Hide Documents
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-3.5 w-3.5" />
                          Documents
                        </>
                      )}
                    </Button>
                  </div>

                  {isExpanded && <ListingDocumentsSection listingId={listing.id} />}
                </li>
              </Reveal>
            );
          })}
        </ul>
      )}

      <div className="mt-6">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </main>
  );
}

// Fetched only for the currently-expanded row (not every row up front) —
// the queue could have many pending listings, and each document lookup is
// a real signed-URL round trip server-side, not worth firing for rows the
// reviewer isn't currently looking at.
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
    <div className="mt-3 space-y-2 border-t border-border pt-3">
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
