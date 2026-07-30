'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AreaUnit,
  ListingPurpose,
  ListingStatus,
  MyListingsFilters,
  PAKISTAN_CITIES,
  formatPrice,
  useMyListingsViewModel,
  usePreferencesViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import { Button, Card, CardContent, DateRange, DateRangePicker, Input, Select, Tabs } from '@jayedaad/ui-web';
import toast from 'react-hot-toast';
import { Copy, Eye, ImageOff, PlusCircle, Trash2, X } from 'lucide-react';

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
  const { preferences } = usePreferencesViewModel();
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

  const { listings, total, pageSize, isLoading, statusCounts, isStatusCountsLoading, remove, submitForVerification } =
    useMyListingsViewModel(filters);

  function handleSubmitForVerification(listingId: string) {
    submitForVerification.mutate(listingId, {
      onSuccess: () => toast.success('Submitted for verification.'),
      onError: () => toast.error('Something went wrong — please try again.'),
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
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
                className="text-sm font-medium text-primary hover:underline"
              >
                More Filters »
              </button>
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-destructive hover:underline">
                Clear filters
              </button>
            </div>
            <Button onClick={applySearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-background shadow-xl">
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
                <Input
                  placeholder="Select Location"
                  value={draft.area}
                  onChange={(e) => setDraft((prev) => ({ ...prev, area: e.target.value }))}
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
          </div>
        </div>
      )}

      <Tabs
        tabs={STATUS_TABS.map((t) => ({
          id: t.id,
          label: `${t.label} (${isStatusCountsLoading ? 0 : (statusCounts[t.id] ?? 0)})`,
        }))}
        activeId={activeTab}
        onChange={changeTab}
      />

      <Card>
        <CardContent className="p-10">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center text-center">
              <ImageOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-sm font-semibold">No {activeTabLabel} Listings</h3>
              <p className="mt-1 text-xs text-muted-foreground">Your {activeTabLabel.toLowerCase()} listings will appear here</p>
              <Link href="/submit" className="mt-4">
                <Button size="sm">
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  Post Listing
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden border-b border-border pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_1.6fr_1.4fr_1fr_auto] sm:items-center sm:gap-4">
                <span>Listing ID</span>
                <span>Property</span>
                <span>Location</span>
                <span>Price</span>
                <span className="text-right">Actions</span>
              </div>
              <ul className="divide-y divide-border">
                {listings.map((listing) => (
                  <li
                    key={listing.id}
                    className="grid grid-cols-1 gap-3 py-4 text-sm sm:grid-cols-[1fr_1.6fr_1.4fr_1fr_auto] sm:items-center sm:gap-4"
                  >
                    <button
                      type="button"
                      onClick={() => handleCopyId(listing.listingNumber)}
                      title="Copy Listing ID"
                      className="flex w-fit items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      {formatListingCode(listing.listingNumber)}
                      <Copy className="h-3 w-3" />
                    </button>
                    <span className="font-medium">{listing.title}</span>
                    <span className="text-muted-foreground">
                      {listing.area}, {listing.city}
                    </span>
                    <span className="font-medium">{formatPrice(Number(listing.price), preferences?.preferredCurrency)}</span>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <Link href={`/submit?edit=${listing.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View / Edit
                        </Button>
                      </Link>
                      {activeTab === 'draft' && (
                        <Button
                          size="sm"
                          disabled={submitForVerification.isPending}
                          onClick={() => handleSubmitForVerification(listing.id)}
                        >
                          Submit
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
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
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
