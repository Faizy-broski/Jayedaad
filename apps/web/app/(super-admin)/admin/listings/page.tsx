'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Listing, ListingDocumentType, ListingStatus, formatPrice, listingsRepository, useAdminListingsViewModel } from '@jayedaad/core';
import { Button, cn, KpiCard, Modal, Pagination, Select } from '@jayedaad/ui-web';
import {
  Building2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  Home,
  ImageOff,
  MapPin,
  ShieldCheck,
  ShieldX,
  User,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

// Owner-listed or independent-agent listings carry their own ownership/
// utility-bill verification documents (see AdminListingDetailPage's
// "Verification Documents" section, GET /listings/:id/documents). An
// agency-affiliated agent's listings are covered by the agency's own
// verification documents instead (same convention as AgentsPage exempting
// agency-linked agents from the individual document-completeness gate) —
// so this split hides the documents row entirely on the Agency tab.
type SourceTab = 'owner_agent' | 'agency';

const SOURCE_TABS: { id: SourceTab; label: string }[] = [
  { id: 'owner_agent', label: 'Owner / Agent' },
  { id: 'agency', label: 'Agency' },
];

const LISTING_DOCUMENT_TYPES: { type: ListingDocumentType; label: string }[] = [
  { type: 'ownership_proof', label: 'Ownership Proof' },
  { type: 'utility_bill', label: 'Utility Bill' },
];

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

const STATUS_BADGE: Record<ListingStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  verified: { label: 'Verified', className: 'bg-primary/10 text-primary' },
  pending_verification: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
  expired: { label: 'Expired', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  deleted: { label: 'Deleted', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  downgraded: { label: 'Downgraded', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  inactive: { label: 'Inactive', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

const PAGE_SIZE = 20;

// Super Admin admin-wide listings — unscoped GET /listings/mine (every
// listing on the platform), restyled to match the card-list/animation
// language used across the rest of admin (Agencies/Agents/CRM), plus a
// direct status-override action distinct from the verification queue's
// approve/reject flow. Stat tiles are real counts from GET
// /listings/mine/status-counts, not a fabricated analytics endpoint.
export default function AdminListingsPage() {
  const [status, setStatus] = useState<ListingStatus>('pending_verification');
  const [sourceTab, setSourceTab] = useState<SourceTab>('owner_agent');
  const [page, setPage] = useState(1);
  const [docsModalListing, setDocsModalListing] = useState<Listing | null>(null);
  // Owner/Agent vs Agency is filtered server-side (findMine's `source`
  // param) rather than over one already-fetched page — at real platform
  // scale, filtering client-side after pagination would make `total`/
  // totalPages wrong and could show a near-empty page for a tab whose
  // matches happened to land on a different page.
  const { listings, total, isLoading, statusCounts, setStatus: setListingStatus } = useAdminListingsViewModel({
    status,
    source: sourceTab,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const counts = useMemo(() => {
    const totalAll = STATUS_TABS.reduce((sum, t) => sum + (statusCounts[t.id] ?? 0), 0);
    return {
      total: totalAll,
      pending: statusCounts.pending_verification ?? 0,
      verified: statusCounts.verified ?? 0,
      rejected: statusCounts.rejected ?? 0,
    };
  }, [statusCounts]);

  function handleTabChange(next: ListingStatus) {
    setStatus(next);
    setPage(1);
  }

  function handleOverride(listingId: string, next: ListingStatus) {
    setListingStatus.mutate(
      { listingId, status: next },
      {
        onSuccess: () => toast.success('Listing status updated.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Home className="h-4 w-4" />
            Listings — all agents
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Listings</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{counts.total}</span> listings across the platform —{' '}
            <span className="font-semibold text-foreground">{counts.pending}</span> awaiting review.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Home, label: 'Total Listings', value: counts.total, sub: 'All statuses' },
          { icon: ShieldCheck, label: 'Verified', value: counts.verified, sub: 'Live on the platform' },
          { icon: Clock, label: 'Pending', value: counts.pending, sub: 'Awaiting review' },
          { icon: ShieldX, label: 'Rejected', value: counts.rejected, sub: 'Needs resubmission' },
        ].map((tile, index) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
          >
            <KpiCard index={index} {...tile} />
          </motion.div>
        ))}
      </div>

      <Reveal>
        <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                status === tab.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {status === tab.id && (
                <motion.span
                  layoutId="adminListingsStatusPill"
                  className="bg-heading-gradient absolute inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">
                {tab.label} ({statusCounts[tab.id] ?? 0})
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
          {SOURCE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSourceTab(tab.id);
                setPage(1);
              }}
              className={cn(
                'relative shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                sourceTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {sourceTab === tab.id && (
                <motion.span
                  layoutId="adminListingsSourcePill"
                  className="bg-heading-gradient absolute inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>
      </Reveal>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center"
        >
          <ImageOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">No listings in this status</h3>
          <p className="mt-1 text-xs text-muted-foreground">Listings will appear here once they reach this status.</p>
        </motion.div>
      )}

      {!isLoading && listings.length > 0 && (
        <>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {listings.map((listing: Listing, index) => {
                const badge = STATUS_BADGE[listing.status];
                const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];
                return (
                  <motion.li
                    key={listing.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.25, delay: Math.min(index, 6) * 0.04 }}
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover.compressedUrl ?? cover.url} alt={listing.title} className="h-full w-full object-cover" />
                          ) : (
                            <ImageOff className="h-5 w-5" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">{listing.title}</p>
                            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', badge.className)}>{badge.label}</span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {listing.area}, {listing.city}
                            </span>
                            <span className="flex items-center gap-1">
                              {listing.agent ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                              {listing.agent?.displayName ?? 'Owner-listed'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <span className="mr-1 text-sm font-semibold text-foreground">{formatPrice(Number(listing.price))}</span>
                        {/* Agency-affiliated listings are covered by the
                            agency's own verification documents (see
                            AgenciesPage) — only owner/independent-agent
                            listings carry their own, so this button only
                            ever shows on the Owner/Agent tab. */}
                        {sourceTab === 'owner_agent' && (
                          <Button variant="outline" size="sm" onClick={() => setDocsModalListing(listing)}>
                            <FileCheck2 className="mr-1 h-3.5 w-3.5" />
                            Documents
                          </Button>
                        )}
                        <Link href={`/admin/listings/${listing.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Select
                          value=""
                          onChange={(e) => handleOverride(listing.id, e.target.value as ListingStatus)}
                          disabled={setListingStatus.isPending}
                          className="h-9 w-auto px-3 text-xs"
                        >
                          <option value="">Change status…</option>
                          {OVERRIDE_STATUSES.filter((s) => s !== listing.status).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_BADGE[s].label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Ownership Proof / Utility Bill for a single owner/independent-agent
          listing — GET /listings/:id/documents already allows
          verification_staff/super_admin to bypass the ownership check (see
          AdminListingDetailPage), just called from a popup here instead of
          only from the detail page. */}
      <Modal open={!!docsModalListing} onClose={() => setDocsModalListing(null)} title={`Documents — ${docsModalListing?.title ?? ''}`}>
        {docsModalListing && <ListingDocumentsSection listingId={docsModalListing.id} />}
      </Modal>
    </div>
  );
}

function ListingDocumentsSection({ listingId }: { listingId: string }) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin', 'listings', listingId, 'documents'],
    queryFn: () => listingsRepository.listDocuments(listingId),
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        LISTING_DOCUMENT_TYPES.map((doc) => {
          const found = documents?.find((d) => d.documentType === doc.type);
          return (
            <div key={doc.type} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm">
                {doc.label}
                {!found && <span className="text-xs text-muted-foreground">Not uploaded</span>}
              </span>
              {found && (
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={found.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </a>
                  <a
                    href={found.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
