'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ListingDocumentType, ListingStatus, formatPrice, listingsRepository, useAdminListingDetailViewModel } from '@jayedaad/core';
import { Badge, cn, Select } from '@jayedaad/ui-web';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Copy,
  Home,
  ImageOff,
  MapPin,
  Phone,
  Ruler,
  Sofa,
  Tag,
  User,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const LISTING_DOCUMENT_TYPES: { type: ListingDocumentType; label: string }[] = [
  { type: 'ownership_proof', label: 'Ownership Proof' },
  { type: 'utility_bill', label: 'Utility Bill' },
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

// Real short/sequential reference number (listings.listing_number) — same
// formatter as the agent property-management list, duplicated locally since
// it isn't exported from @jayedaad/core.
function formatListingCode(listingNumber: number): string {
  return `JYD-${String(listingNumber).padStart(5, '0')}`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

// Read-only listing detail for Super Admin, rendered inside the admin shell
// (apps/web/app/(super-admin)/layout.tsx) — deliberately NOT a link into
// /submit's edit form, which lives under the agent route group and renders
// the agent Profolio shell instead.
export default function AdminListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { listing, isLoading, setStatus } = useAdminListingDetailViewModel(params.id);
  const [activeImage, setActiveImage] = useState(0);

  // GET /listings/:id/documents already allows verification_staff/super_admin
  // to bypass the ownership check (see assertCanAccessDocuments) — this was
  // simply never called from any admin-facing page until now.
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['admin', 'listings', params.id, 'documents'],
    queryFn: () => listingsRepository.listDocuments(params.id),
    enabled: !!listing,
  });

  function handleOverride(next: ListingStatus) {
    setStatus.mutate(
      { status: next },
      {
        onSuccess: () => toast.success('Listing status updated.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleCopyId(listingNumber: number) {
    navigator.clipboard.writeText(formatListingCode(listingNumber));
    toast.success('Listing ID copied.');
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted/40" />
        <div className="h-72 animate-pulse rounded-xl border border-border bg-muted/40" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40 lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
        <ImageOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <h3 className="text-sm font-semibold text-foreground">Listing not found</h3>
        <button type="button" onClick={() => router.back()} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Go back
        </button>
      </div>
    );
  }

  const badge = STATUS_BADGE[listing.status];
  const sortedMedia = [...listing.media].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
  const currentImage = sortedMedia[activeImage] ?? sortedMedia[0];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to listings
            </button>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{listing.title}</h1>
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', badge.className)}>{badge.label}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {listing.area}, {listing.city}
              </span>
              <button
                type="button"
                onClick={() => handleCopyId(listing.listingNumber)}
                title="Copy Listing ID"
                className="flex items-center gap-1 font-mono hover:text-foreground"
              >
                {formatListingCode(listing.listingNumber)}
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="text-2xl font-bold text-foreground">{formatPrice(Number(listing.price))}</p>
            <Select
              value=""
              onChange={(e) => handleOverride(e.target.value as ListingStatus)}
              disabled={setStatus.isPending}
              className="h-9 w-auto rounded-full px-4 text-xs"
            >
              <option value="">Override status…</option>
              {OVERRIDE_STATUSES.filter((s) => s !== listing.status).map((s) => (
                <option key={s} value={s}>
                  {STATUS_BADGE[s].label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Reveal>

      <Reveal>
        {sortedMedia.length > 0 ? (
          <div className="space-y-2">
            <motion.div
              key={currentImage?.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentImage?.compressedUrl ?? currentImage?.url} alt={listing.title} className="h-full w-full object-cover" />
            </motion.div>
            {sortedMedia.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sortedMedia.map((m, i) => (
                  <button
                    key={m.url}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                      i === activeImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.compressedUrl ?? m.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
            <ImageOff className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No photos uploaded.</p>
          </div>
        )}
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <div className="space-y-6 rounded-xl border border-border bg-background p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Fact icon={Tag} label="Purpose" value={listing.purpose} />
              <Fact icon={BedDouble} label="Bedrooms" value={listing.bedrooms ?? '—'} />
              <Fact icon={Bath} label="Bathrooms" value={listing.bathrooms ?? '—'} />
              <Fact icon={Ruler} label="Size" value={listing.areaValue ? `${listing.areaValue} ${listing.areaUnit}` : '—'} />
              <Fact icon={Sofa} label="Furnishing" value={listing.furnishingStatus?.replace('_', ' ') ?? '—'} />
              <Fact icon={Calendar} label="Listed" value={new Date(listing.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} />
            </div>

            {listing.description && (
              <div>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{listing.description}</p>
              </div>
            )}

            {listing.amenities.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((a) => (
                    <Badge key={a.slug}>{a.label}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal>
          <div className="space-y-5 rounded-xl border border-border bg-background p-6 shadow-sm">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Listed By</h3>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {listing.agent?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.agent.photoUrl} alt={listing.agent.displayName ?? ''} className="h-full w-full object-cover" />
                  ) : listing.agent?.displayName ? (
                    initials(listing.agent.displayName)
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{listing.agent?.displayName ?? 'Owner-listed'}</p>
                  {listing.agent?.agency ? (
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 shrink-0" />
                      {listing.agent.agency.name}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Independent</p>
                  )}
                </div>
              </div>
              {listing.agent?.subscriptionTierName && (
                <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {listing.agent.subscriptionTierName}
                </span>
              )}
            </div>

            {listing.contactNumbers.length > 0 && (
              <div className="border-t border-border pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>
                <div className="space-y-1.5">
                  {listing.contactNumbers.map((c, i) => (
                    <a
                      key={i}
                      href={`tel:${c.countryCode}${c.number}`}
                      className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary"
                    >
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {c.countryCode} {c.number}
                      <span className="text-xs capitalize text-muted-foreground">({c.type})</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="space-y-3 rounded-xl border border-border bg-background p-6 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verification Documents</h3>
          {documentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            LISTING_DOCUMENT_TYPES.map((doc) => {
              const found = documents?.find((d) => d.documentType === doc.type);
              return (
                <div key={doc.type} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground">{doc.label}</span>
                  {found ? (
                    <a
                      href={found.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
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
      </Reveal>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string | number }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium capitalize text-foreground">{value}</p>
      </div>
    </div>
  );
}
