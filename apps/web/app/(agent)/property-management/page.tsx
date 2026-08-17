'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AgentCreditType,
  AreaUnit,
  ListingDocumentType,
  ListingPurpose,
  ListingStatus,
  MyListingsFilters,
  PAKISTAN_CITIES,
  listingsRepository,
  useAgentCreditsViewModel,
  useMyListingsViewModel,
  useFormattedPrice,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import { Button, Card, CardContent, DateRange, DateRangePicker, Input, Pagination, Select, Table, TableColumn } from '@jayedaad/ui-web';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from '@/components/Reveal';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';
import { CreditsMenu } from '@/components/shared/CreditsMenu';
import {
  Building2,
  Copy,
  Eye,
  FileCheck2,
  Flame,
  ImageOff,
  MapPin,
  PlusCircle,
  Sparkles,
  Clapperboard,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';

// Same set the server enforces (REQUIRED_LISTING_DOCUMENT_TYPES in
// listings.repository.ts) — kept in sync manually, same convention as
// submit/documents/page.tsx's own DOCUMENT_TYPES array.
const REQUIRED_LISTING_DOCUMENT_TYPES: ListingDocumentType[] = ['ownership_proof', 'utility_bill'];

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  marla: 'Marla',
  kanal: 'Kanal',
  sqyd: 'Sq. Yd.',
  sqft: 'Sq. Ft.',
  sqm: 'Sq. M.',
  acre: 'Acre',
};

const PRICE_MAX = 1_000_000_000; // 1 Arab (South Asian numbering)
const PRICE_STEP = 500_000;
const AREA_MAX = 10_000;
const AREA_STEP = 10;

// South Asian numbering (Lac/Crore/Arab) — matches how the reference design
// labels its price-range bounds.
function formatPkrShort(value: number): string {
  if (value >= 1_000_000_000) return `${trimZero(value / 1_000_000_000)} Arab`;
  if (value >= 10_000_000) return `${trimZero(value / 10_000_000)} Crore`;
  if (value >= 100_000) return `${trimZero(value / 100_000)} Lac`;
  return value.toString();
}
function trimZero(n: number): string {
  return n % 1 === 0 ? n.toString() : n.toFixed(1);
}

// Real short/sequential reference number (listings.listing_number, a
// Postgres identity column) — genuinely readable and re-searchable, unlike
// the old truncated-UUID display which was neither.
function formatListingCode(listingNumber: number): string {
  return `JYD-${String(listingNumber).padStart(5, '0')}`;
}

const STATUS_TABS: { id: ListingStatus; label: string }[] = [
  { id: 'draft', label: 'Drafts' },
  { id: 'verified', label: 'Active' },
  { id: 'pending_verification', label: 'Pending' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'expired', label: 'Expired' },
  { id: 'deleted', label: 'Deleted' },
  // { id: 'downgraded', label: 'Downgraded' },
  { id: 'inactive', label: 'Inactive' },
];

const STATUS_BADGE: Record<ListingStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  verified: { label: 'Active', className: 'bg-primary/10 text-primary' },
  pending_verification: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
  expired: { label: 'Expired', className: 'bg-slate-100 text-slate-600' },
  deleted: { label: 'Deleted', className: 'bg-slate-100 text-slate-600' },
  downgraded: { label: 'Downgraded', className: 'bg-slate-100 text-slate-600' },
  inactive: { label: 'Inactive', className: 'bg-slate-100 text-slate-600' },
};

interface DraftFilters {
  listingNumber: string;
  propertyTypeSlug: string;
  purpose: ListingPurpose | '';
  dateRange: DateRange;
  categorySlug: string;
  city: string;
  area: string;
  minPrice: number;
  maxPrice: number;
  minAreaValue: number;
  maxAreaValue: number;
  areaUnit: AreaUnit;
}

const EMPTY_DRAFT: DraftFilters = {
  listingNumber: '',
  propertyTypeSlug: '',
  purpose: '',
  dateRange: {},
  categorySlug: '',
  city: '',
  area: '',
  minPrice: 0,
  maxPrice: PRICE_MAX,
  minAreaValue: 0,
  maxAreaValue: AREA_MAX,
  areaUnit: 'sqm',
};

// Profolio "My Listings" reference: filter bar + status tabs (with count
// badges) + empty/populated list + pagination. Reuses the /property-management
// route the agent-layout nav already links to (apps/web/app/(agent)/layout.tsx).
export default function PropertyManagementPage() {
  const searchParams = useSearchParams();
  const { propertyTypes } = useTaxonomyViewModel();
  const { format: formatPrice } = useFormattedPrice();
  const [activeTab, setActiveTab] = useState<ListingStatus>('verified');
  const [draft, setDraft] = useState<DraftFilters>(EMPTY_DRAFT);
  const [applied, setApplied] = useState<DraftFilters>(EMPTY_DRAFT);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Deep-link from the topbar's Listing ID search (apps/web/app/(agent)/layout.tsx)
  // — status is unknown ahead of time, so the query below skips the status
  // filter entirely whenever a listingNumber search is active, rather than
  // requiring the user to guess which status tab the match is under.
  useEffect(() => {
    const listingNumber = searchParams.get('listingNumber');
    if (!listingNumber) return;
    setDraft((prev) => ({ ...prev, listingNumber }));
    setApplied((prev) => ({ ...prev, listingNumber }));
  }, [searchParams]);

  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) {
      acc.push({ slug: type.category.slug, label: type.category.label });
    }
    return acc;
  }, []);

  const filters: MyListingsFilters = {
    status: applied.listingNumber ? undefined : activeTab,
    listingNumber: applied.listingNumber ? Number(applied.listingNumber.replace(/\D/g, '')) : undefined,
    propertyTypeCategory: applied.categorySlug || undefined,
    propertyTypeSlug: applied.propertyTypeSlug || undefined,
    purpose: applied.purpose || undefined,
    city: applied.city || undefined,
    area: applied.area || undefined,
    minPrice: applied.minPrice > 0 ? applied.minPrice : undefined,
    maxPrice: applied.maxPrice < PRICE_MAX ? applied.maxPrice : undefined,
    minAreaValue: applied.minAreaValue > 0 ? applied.minAreaValue : undefined,
    maxAreaValue: applied.maxAreaValue < AREA_MAX ? applied.maxAreaValue : undefined,
    areaUnit: applied.minAreaValue > 0 || applied.maxAreaValue < AREA_MAX ? applied.areaUnit : undefined,
    listedDateFrom: applied.dateRange.from,
    listedDateTo: applied.dateRange.to,
    page,
    pageSize: 20,
  };

  const router = useRouter();
  const {
    listings,
    total,
    pageSize,
    isLoading,
    isError,
    statusCounts,
    isStatusCountsLoading,
    remove,
    submitForVerification,
    boost,
    renew,
    refresh,
    postStory,
  } = useMyListingsViewModel(filters);
  // Pre-flight balance so the Hot/Super Hot/Refresh/Story buttons can show
  // "N left" and disable at 0 instead of only finding out via a server error
  // after clicking — server (POST /listings/:id/boost|refresh|story) stays
  // the actual source of truth, this is purely an additive UI convenience.
  const { credits } = useAgentCreditsViewModel();
  const creditsAvailable = (type: AgentCreditType) => credits.find((c) => c.creditType === type)?.available ?? 0;

  // Spends one of the agent's plan-granted Hot/Super Hot credits (topped up
  // on tier selection/renewal — see the Plan page) to feature this listing.
  // The server remains the source of truth on whether a credit is actually
  // available (POST /listings/:id/boost).
  function handleBoost(listingId: string, boostTier: 'hot' | 'super_hot') {
    boost.mutate(
      { listingId, input: { boostTier } },
      {
        onSuccess: () => toast.success(`Listing boosted (${boostTier === 'hot' ? 'Hot' : 'Super Hot'}).`),
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  // Resets an expired listing back to 'verified' with a fresh expiry window
  // (PlanLifecycleService's cron sets status: 'expired' once a plan's
  // listingDurationDays lapses) — the Expired tab's "Renew" action.
  function handleRenew(listingId: string) {
    renew.mutate(listingId, {
      onSuccess: () => toast.success('Listing renewed.'),
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
    });
  }

  // Spends one of the agent's plan-granted Refresh credits to bump this
  // listing's sort position within its current boost tier (POST
  // /listings/:id/refresh) — same "server is the source of truth on
  // available credits" approach as handleBoost.
  function handleRefresh(listingId: string) {
    refresh.mutate(listingId, {
      onSuccess: () => toast.success('Listing refreshed.'),
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
    });
  }

  // Spends one of the agent's plan-granted Story credits to feature this
  // listing for a fixed 24h window (POST /listings/:id/story).
  function handlePostStory(listingId: string) {
    postStory.mutate(listingId, {
      onSuccess: () => toast.success('Listing posted as a story.'),
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
    });
  }

  // Ownership proof/utility bill are required for individual owners and
  // independent agents (no agency) — only an agency-affiliated agent's
  // listing is exempt, mirrors the server's getDocumentCompleteness. If
  // incomplete, route to the documents screen instead of submitting
  // directly — closes the bug where finishing a draft from this page
  // skipped ownership-proof entirely (the server now also hard-rejects
  // this via assertDocumentsComplete, this is just so the user lands on
  // the right screen instead of a raw error toast).
  async function handleSubmitForVerification(listing: (typeof listings)[number]) {
    if (!listing.agent?.agency) {
      const docs = await listingsRepository.listDocuments(listing.id);
      const uploadedTypes = new Set(docs.map((d) => d.documentType));
      const incomplete = REQUIRED_LISTING_DOCUMENT_TYPES.some((type) => !uploadedTypes.has(type));
      if (incomplete) {
        router.push(`/submit/documents?listingId=${listing.id}&submitOnComplete=1`);
        return;
      }
    }
    submitForVerification.mutate(listing.id, {
      onSuccess: () => toast.success('Submitted for verification.'),
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
    });
  }

  function handleCopyId(listingNumber: number) {
    navigator.clipboard.writeText(formatListingCode(listingNumber));
    toast.success('Listing ID copied.');
  }

  function handleDelete(listingId: string, title: string) {
    if (!confirm(`Delete "${title}"? It will move to the Deleted tab.`)) return;
    remove.mutate(listingId, {
      onSuccess: () => toast.success('Listing deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  function applySearch() {
    setApplied(draft);
    setPage(1);
  }

  function clearFilters() {
    setDraft(EMPTY_DRAFT);
    setApplied(EMPTY_DRAFT);
    setPage(1);
  }

  function applyPanelFilters() {
    setApplied(draft);
    setPage(1);
    setFiltersOpen(false);
  }

  function resetPanelFilters() {
    setDraft((prev) => ({
      ...prev,
      categorySlug: '',
      city: '',
      area: '',
      minPrice: 0,
      maxPrice: PRICE_MAX,
      minAreaValue: 0,
      maxAreaValue: AREA_MAX,
      areaUnit: 'sqm',
    }));
  }

  function changeTab(id: string) {
    setActiveTab(id as ListingStatus);
    setPage(1);
  }

  const activeTabLabel = STATUS_TABS.find((t) => t.id === activeTab)?.label ?? '';
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // A real table (same Table/TableColumn primitive ProjectsListView.tsx
  // already uses for its own agent/admin listing management) instead of
  // the previous card-per-listing layout — Property ID and Location get
  // their own header once, not re-labeled inside every single row, and a
  // column's width is shared/consistent down the whole list rather than
  // each card negotiating space against its own action buttons.
  const columns: TableColumn<(typeof listings)[number]>[] = [
    {
      key: 'property',
      header: 'Property',
      render: (listing) => {
        const status = STATUS_BADGE[listing.status];
        return (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="max-w-[220px] truncate text-sm font-semibold text-foreground">{listing.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>{status.label}</span>
                {listing.boostTier !== 'basic' && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    {listing.boostTier === 'super_hot' ? <Flame className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    {listing.boostTier === 'super_hot' ? 'Super Hot' : 'Hot'}
                  </span>
                )}
                {listing.storyExpiresAt && new Date(listing.storyExpiresAt) > new Date() && (
                  <span className="flex items-center gap-1 rounded-full bg-fuchsia-100 px-2 py-0.5 text-[11px] font-medium text-fuchsia-700">
                    <Clapperboard className="h-3 w-3" />
                    Story
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'propertyId',
      header: 'Property ID',
      render: (listing) => (
        <button
          type="button"
          onClick={() => handleCopyId(listing.listingNumber)}
          title="Copy Listing ID"
          className="flex items-center gap-1 font-mono text-sm font-bold text-foreground hover:text-primary"
        >
          {formatListingCode(listing.listingNumber)}
          <Copy className="h-3 w-3" />
        </button>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (listing) => (
        <span className="flex items-center gap-1 text-sm text-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
          {listing.area}, {listing.city}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (listing) => <span className="text-sm font-semibold text-foreground">{formatPrice(Number(listing.price))}</span>,
    },
    {
      key: 'expires',
      header: 'Expires',
      render: (listing) =>
        listing.status === 'verified' && listing.expiresAt ? (
          <span className="text-sm text-muted-foreground">
            {new Date(listing.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (listing) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link href={`/submit?edit=${listing.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View / Edit
            </Button>
          </Link>
          {/* Re-entry point for ownership proof/utility bill — was promised
              in submit/documents/page.tsx's own copy ("you can also do this
              later from My Properties") but never actually existed here;
              mobile's MyPropertiesScreen already has this. Owner and
              independent-agent listings only — an agency-affiliated
              agent's listing is exempt. */}
          {!listing.agent?.agency && (
            <Link href={`/submit/documents?listingId=${listing.id}`}>
              <Button variant="outline" size="sm">
                <FileCheck2 className="mr-1.5 h-3.5 w-3.5" />
                Documents
              </Button>
            </Link>
          )}
          {activeTab === 'draft' && (
            <Button size="sm" disabled={submitForVerification.isPending} onClick={() => handleSubmitForVerification(listing)}>
              Submit
            </Button>
          )}
          {listing.status === 'verified' && (
            <CreditsMenu
              creditsAvailable={creditsAvailable}
              isPending={boost.isPending || refresh.isPending || postStory.isPending}
              onHot={() => handleBoost(listing.id, 'hot')}
              onSuperHot={() => handleBoost(listing.id, 'super_hot')}
              onRefresh={() => handleRefresh(listing.id)}
              onStory={() => handlePostStory(listing.id)}
            />
          )}
          {listing.status === 'expired' && (
            <Button size="sm" disabled={renew.isPending} onClick={() => handleRenew(listing.id)}>
              Renew
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            disabled={remove.isPending}
            onClick={() => handleDelete(listing.id, listing.title)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Property Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track, edit, and manage every listing you&apos;ve posted.</p>
        </div>
      </Reveal>

      <Reveal><Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Enter Listing ID (e.g. JYD-00001)"
              value={draft.listingNumber}
              onChange={(e) => setDraft((prev) => ({ ...prev, listingNumber: e.target.value }))}
            />
            <Select
              value={draft.propertyTypeSlug}
              onChange={(e) => setDraft((prev) => ({ ...prev, propertyTypeSlug: e.target.value }))}
            >
              <option value="">Select Property Type</option>
              {propertyTypes.map((type) => (
                <option key={type.id} value={type.slug}>
                  {type.label}
                </option>
              ))}
            </Select>
            <Select
              value={draft.purpose}
              onChange={(e) => setDraft((prev) => ({ ...prev, purpose: e.target.value as ListingPurpose | '' }))}
            >
              <option value="">Select Purpose</option>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </Select>
            <DateRangePicker
              value={draft.dateRange}
              onChange={(range) => setDraft((prev) => ({ ...prev, dateRange: range }))}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                More Filters
              </button>
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-destructive hover:underline">
                Clear filters
              </button>
            </div>
            <Button onClick={applySearch}>Search</Button>
          </div>
        </CardContent>
      </Card></Reveal>

      <AnimatePresence>
      {filtersOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex justify-end"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-background shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-border p-6">
              <div>
                <h2 className="text-lg font-semibold">Filters</h2>
                <p className="mt-1 text-sm text-muted-foreground">Apply filters to organize data accordingly</p>
              </div>
              <button type="button" onClick={() => setFiltersOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 p-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <Select value={draft.categorySlug} onChange={(e) => setDraft((prev) => ({ ...prev, categorySlug: e.target.value }))}>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">City</label>
                <Select value={draft.city} onChange={(e) => setDraft((prev) => ({ ...prev, city: e.target.value }))}>
                  <option value="">Select City</option>
                  {PAKISTAN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Location</label>
                <PlacesAutocompleteInput
                  placeholder="Select Location"
                  value={draft.area}
                  onChange={(v) => setDraft((prev) => ({ ...prev, area: v }))}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Price Range</label>
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, minPrice: 0, maxPrice: PRICE_MAX }))}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={draft.minPrice || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, minPrice: e.target.value ? Number(e.target.value) : 0 }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">To</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={draft.maxPrice < PRICE_MAX ? draft.maxPrice : ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, maxPrice: e.target.value ? Number(e.target.value) : PRICE_MAX }))
                    }
                  />
                </div>
                <RangeSlider
                  min={0}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  valueMin={draft.minPrice}
                  valueMax={draft.maxPrice}
                  onChangeMin={(v) => setDraft((prev) => ({ ...prev, minPrice: v }))}
                  onChangeMax={(v) => setDraft((prev) => ({ ...prev, maxPrice: v }))}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPkrShort(0)}</span>
                  <span>{formatPkrShort(PRICE_MAX)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Area Range</label>
                  <div className="flex items-center gap-3">
                    <Select
                      value={draft.areaUnit}
                      onChange={(e) => setDraft((prev) => ({ ...prev, areaUnit: e.target.value as AreaUnit }))}
                      className="h-8 py-0 text-xs"
                    >
                      {AREA_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {AREA_UNIT_LABELS[unit]}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, minAreaValue: 0, maxAreaValue: AREA_MAX }))}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={draft.minAreaValue || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, minAreaValue: e.target.value ? Number(e.target.value) : 0 }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">To</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={draft.maxAreaValue < AREA_MAX ? draft.maxAreaValue : ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, maxAreaValue: e.target.value ? Number(e.target.value) : AREA_MAX }))
                    }
                  />
                </div>
                <RangeSlider
                  min={0}
                  max={AREA_MAX}
                  step={AREA_STEP}
                  valueMin={draft.minAreaValue}
                  valueMax={draft.maxAreaValue}
                  onChangeMin={(v) => setDraft((prev) => ({ ...prev, minAreaValue: v }))}
                  onChangeMax={(v) => setDraft((prev) => ({ ...prev, maxAreaValue: v }))}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 {AREA_UNIT_LABELS[draft.areaUnit]}</span>
                  <span>
                    {AREA_MAX.toLocaleString()} {AREA_UNIT_LABELS[draft.areaUnit]}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border p-6">
              <Button variant="outline" onClick={resetPanelFilters}>
                Reset Filters
              </Button>
              <Button onClick={applyPanelFilters}>Search</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <Reveal>
        <div className="flex flex-wrap gap-1 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
          {STATUS_TABS.map((t) => {
            const count = isStatusCountsLoading ? 0 : (statusCounts[t.id] ?? 0);
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => changeTab(t.id)}
                className={`relative shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="activePropertyStatusPill"
                    className="bg-heading-gradient absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">
                  {t.label} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-destructive/40 py-16 text-center">
          <ImageOff className="mb-3 h-10 w-10 text-destructive/50" />
          <h3 className="text-sm font-semibold text-foreground">Couldn&apos;t load your listings</h3>
          <p className="mt-1 text-xs text-muted-foreground">Please try again in a moment.</p>
        </div>
      )}

      {!isLoading && !isError && listings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center"
        >
          <ImageOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">No {activeTabLabel} Listings</h3>
          <p className="mt-1 text-xs text-muted-foreground">Your {activeTabLabel.toLowerCase()} listings will appear here</p>
          <Link href="/submit" className="mt-4">
            <Button size="sm">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Post Listing
            </Button>
          </Link>
        </motion.div>
      )}

      {!isLoading && listings.length > 0 && (
        <>
          <Table columns={columns} rows={listings} rowKey={(listing) => listing.id} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

// Dual-thumb range slider — no ui-web primitive exists for this yet, so it's
// built from two overlapping native <input type="range"> tracks (transparent
// track, styled thumb only) with a colored bar between the two thumbs.
function RangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
}: {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
}) {
  const minPct = ((valueMin - min) / (max - min)) * 100;
  const maxPct = ((valueMax - min) / (max - min)) * 100;
  const thumbClasses =
    'pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow';

  return (
    <div className="relative h-4">
      <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-muted" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
        style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMin}
        onChange={(e) => onChangeMin(Math.min(Number(e.target.value), valueMax - step))}
        className={thumbClasses}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        onChange={(e) => onChangeMax(Math.max(Number(e.target.value), valueMin + step))}
        className={thumbClasses}
      />
    </div>
  );
}
