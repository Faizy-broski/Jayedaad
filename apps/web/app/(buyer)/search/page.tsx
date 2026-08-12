'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BookmarkPlus, ChevronDown, Heart } from 'lucide-react';
import {
  AreaUnit,
  FurnishingStatus,
  Listing,
  ListingPurpose,
  ListingSearchFilters,
  PAKISTAN_CITIES,
  listingsRepository,
  useAuthViewModel,
  useFormattedPrice,
  useListingSearchViewModel,
  useSavedSearchesViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import { getViewerSessionId } from '@/lib/viewerSession';
import { PRICE_OPTIONS, priceOptionLabel } from '@/lib/priceOptions';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';
import { useFavorites } from '@/lib/favoritesContext';

// Fires the real engagement-tracking event (backs the agent dashboard's
// Calls/WhatsApp/SMS analytics, which were previously always 0 — nothing
// anywhere called this endpoint) then performs the real native action.
// Fire-and-forget: a failed track shouldn't block the actual call/message.
function trackAndOpen(listingId: string, type: 'call' | 'whatsapp' | 'sms', url: string) {
  listingsRepository
    .trackEngagement(listingId, { type, platform: 'web', viewerSessionId: getViewerSessionId() })
    .catch(() => { });
  window.location.href = url;
}

function ContactActions({ listing }: { listing: Listing }) {
  const mobile = listing.contactNumbers.find((c) => c.type === 'mobile');
  const landline = listing.contactNumbers.find((c) => c.type === 'landline');
  const callContact = mobile ?? landline;
  if (!callContact) return <FavoriteButton listingId={listing.id} />;

  const callNumber = `${callContact.countryCode}${callContact.number}`;
  const whatsappDigits = mobile ? `${mobile.countryCode}${mobile.number}`.replace(/\D/g, '') : undefined;
  const smsNumber = mobile ? `${mobile.countryCode}${mobile.number}` : undefined;

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      <FavoriteButton listingId={listing.id} />
      <button
        type="button"
        onClick={() => trackAndOpen(listing.id, 'call', `tel:${callNumber}`)}
        className="rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground"
      >
        Call
      </button>
      {whatsappDigits && (
        <button
          type="button"
          onClick={() => trackAndOpen(listing.id, 'whatsapp', `https://wa.me/${whatsappDigits}`)}
          className="rounded-md border border-slate-300 px-2 py-1 font-medium"
        >
          WhatsApp
        </button>
      )}
      {smsNumber && (
        <button
          type="button"
          onClick={() => trackAndOpen(listing.id, 'sms', `sms:${smsNumber}`)}
          className="rounded-md border border-slate-300 px-2 py-1 font-medium"
        >
          SMS
        </button>
      )}
    </div>
  );
}

// Local heart affordance for this page's own list-style card — not
// PropertyCard (which this page deliberately doesn't use, to keep
// ContactActions' call/WhatsApp/SMS row exactly as-is), but wired to the
// same shared FavoritesProvider context so state stays in sync everywhere.
function FavoriteButton({ listingId }: { listingId: string }) {
  const { isFavorited, toggle } = useFavorites();
  const favorited = isFavorited(listingId);
  return (
    <button
      type="button"
      aria-label={favorited ? 'Remove from favorites' : 'Save listing'}
      aria-pressed={favorited}
      onClick={() => toggle(listingId)}
      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
        favorited ? 'border-primary text-primary' : 'border-slate-300 text-slate-500 hover:text-primary'
      }`}
    >
      <Heart className="h-3.5 w-3.5" fill={favorited ? 'currentColor' : 'none'} />
      {favorited ? 'Saved' : 'Save'}
    </button>
  );
}

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const BED_OPTIONS = ['1', '2', '3', '4', '5', '6+'];
const BATH_OPTIONS = ['1+', '2+', '3+', '4+', '5+'];
const FURNISHING_OPTIONS: { value: FurnishingStatus; label: string }[] = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi Furnished' },
  { value: 'furnished', label: 'Furnished' },
];

// Field label + control cell — matches Zameen.com's search bar: small
// uppercase label above the control, cells separated by dividers, on a
// dark bar (reuses --brand-dark, the same deliberate-dark-section token
// used for CTA banners elsewhere, see app/globals.css).
function FilterCell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 px-4 py-2.5 ${className ?? ''}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/50">{label}</span>
      {children}
    </div>
  );
}

const fieldClasses =
  'w-full appearance-none bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/40 [color-scheme:dark]';

// Buyer search — View only. All data fetching/business logic lives in
// useListingSearchViewModel / useTaxonomyViewModel (packages/core), shared
// verbatim with apps/mobile. Filter bar mirrors Zameen.com's search facets
// exactly: Purpose, City, Location, Property Type, Area, Price, Beds, Baths,
// Keyword, More Options (furnishing/video, folded in since Zameen's own
// "More Options" is itself an expandable extra-filters panel).
export default function SearchPage() {
  // useSearchParams() requires a Suspense boundary in the app router, or
  // the build fails — the homepage's Browse by Category / Where We Live
  // cards link here with ?propertyTypeCategory=/?city=, so the initial
  // filters have to come from the URL, not just local state.
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-12">Loading…</main>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { propertyTypes } = useTaxonomyViewModel();
  const { format: formatPrice } = useFormattedPrice();
  const { isAuthenticated } = useAuthViewModel();
  const { create: createSavedSearch } = useSavedSearchesViewModel();

  const [purpose, setPurpose] = useState<ListingPurpose>(() => (searchParams.get('purpose') === 'rent' ? 'rent' : 'sale'));
  const [city, setCity] = useState(() => searchParams.get('city') ?? '');
  const [area, setArea] = useState('');
  const [categorySlug, setCategorySlug] = useState(() => searchParams.get('propertyTypeCategory') ?? '');
  const [propertyTypeSlug, setPropertyTypeSlug] = useState(() => searchParams.get('propertyTypeSlug') ?? '');
  const [minAreaValue, setMinAreaValue] = useState(() => searchParams.get('minAreaValue') ?? '');
  const [maxAreaValue, setMaxAreaValue] = useState(() => searchParams.get('maxAreaValue') ?? '');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>(() => (searchParams.get('areaUnit') as AreaUnit) || 'marla');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') ?? '');
  const [bedrooms, setBedrooms] = useState('');
  const [minBathrooms, setMinBathrooms] = useState('');
  const [keyword, setKeyword] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [furnishingStatus, setFurnishingStatus] = useState<FurnishingStatus | ''>('');
  const [hasVideo, setHasVideo] = useState(false);

  const moreSelectedCount = (furnishingStatus ? 1 : 0) + (hasVideo ? 1 : 0);

  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);
  const typesInSelectedCategory = categorySlug ? propertyTypes.filter((t) => t.category?.slug === categorySlug) : propertyTypes;

  const baseFilters: Omit<ListingSearchFilters, 'propertyTypeSlug'> = {
    city: city || undefined,
    area: area || undefined,
    purpose,
    bedrooms: bedrooms ? Number(bedrooms.replace('+', '')) : undefined,
    minBathrooms: minBathrooms ? Number(minBathrooms.replace('+', '')) : undefined,
    minAreaValue: minAreaValue ? Number(minAreaValue) : undefined,
    maxAreaValue: maxAreaValue ? Number(maxAreaValue) : undefined,
    areaUnit,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    keyword: keyword || undefined,
    furnishingStatus: furnishingStatus || undefined,
    hasVideo: hasVideo || undefined,
      };

  const singleTypeResult = useListingSearchViewModel({
    ...baseFilters,
    propertyTypeSlug: propertyTypeSlug || undefined,
  });

  // A category alone (e.g. arriving from the homepage's Browse by Category
  // cards) has no single propertyTypeSlug to filter by — GET /listings only
  // accepts one. So this fans out one request per real property type under
  // the selected category and merges the pages client-side, instead of
  // silently ignoring the category and showing everything.
  const categoryTypeSlugs = categorySlug && !propertyTypeSlug ? typesInSelectedCategory.map((t) => t.slug) : [];
  const categoryQueries = useQueries({
    queries: categoryTypeSlugs.map((slug) => ({
      queryKey: ['listings', 'public', 'category', slug, baseFilters],
      queryFn: () => listingsRepository.searchPublic({ ...baseFilters, propertyTypeSlug: slug, pageSize: 50 }),
    })),
  });

  const isCategoryMode = categoryTypeSlugs.length > 0;
  const listings = isCategoryMode
    ? categoryQueries
        .flatMap((q) => q.data?.items ?? [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : singleTypeResult.listings;
  const isLoading = isCategoryMode ? categoryQueries.some((q) => q.isLoading) : singleTypeResult.isLoading;
  // Previously the "No verified listings yet" text below fired on ANY
  // failed fetch too (a 429/5xx renders an empty `listings` array
  // identically to a real empty result) — distinguishing them so a backend
  // hiccup shows up as a visible, retryable error instead of looking like
  // there's genuinely nothing to find.
  const isError = isCategoryMode ? categoryQueries.some((q) => q.isError) : !!singleTypeResult.error;

  // Auto-generated from the active filters (e.g. "Flat · DHA · Rent") rather
  // than prompting the buyer for a custom name — no "save search" creation
  // UI exists on mobile to mirror, and this keeps the flow to one click.
  const activeTypeLabel = propertyTypeSlug
    ? typesInSelectedCategory.find((t) => t.slug === propertyTypeSlug)?.label
    : categorySlug
      ? categories.find((c) => c.slug === categorySlug)?.label
      : undefined;
  const savedSearchName = [activeTypeLabel ?? 'Properties', area || city || undefined, purpose === 'rent' ? 'Rent' : 'Buy']
    .filter(Boolean)
    .join(' · ');

  function handleSaveSearch() {
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${encodeURIComponent('/search')}`);
      return;
    }
    createSavedSearch.mutate(
      { name: savedSearchName, filters: { ...baseFilters, propertyTypeSlug: propertyTypeSlug || undefined }, alertFrequency: 'daily' },
      {
        onSuccess: () => toast.success('Search saved — see it under Favorites & Saved Searches.'),
        onError: () => toast.error('Could not save this search — please try again.'),
      },
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Search Verified Properties</h1>
        <button
          type="button"
          onClick={handleSaveSearch}
          disabled={createSavedSearch.isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          {createSavedSearch.isPending ? 'Saving…' : 'Save Search'}
        </button>
      </div>

      <div className="relative mb-8 rounded-xl bg-[hsl(var(--brand-dark))] shadow-lg">
        <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-6 sm:divide-x sm:divide-y-0">
          <FilterCell label="Purpose">
            <select value={purpose} onChange={(e) => setPurpose(e.target.value as ListingPurpose)} className={fieldClasses}>
              <option value="sale">Buy</option>
              <option value="rent">Rent</option>
            </select>
          </FilterCell>
          <FilterCell label="City">
            <select value={city} onChange={(e) => setCity(e.target.value)} className={fieldClasses}>
              <option value="">Any City</option>
              {PAKISTAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterCell>
          <FilterCell label="Location">
            <PlacesAutocompleteInput
              value={area}
              onChange={setArea}
              placeholder="Search location"
              // PlacesAutocompleteInput renders ui-web's styled <Input>,
              // which has its own border/height/padding — neutralized here
              // (border-0/h-auto/px-0/py-0) so it matches this dark filter
              // bar's borderless siblings instead of boxing just this field.
              className={`${fieldClasses} h-auto rounded-none border-0 px-0 py-0`}
            />
          </FilterCell>
          <FilterCell label="Category">
            <select
              value={categorySlug}
              onChange={(e) => {
                setCategorySlug(e.target.value);
                setPropertyTypeSlug('');
              }}
              className={fieldClasses}
            >
              <option value="">Any Category</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </FilterCell>
          <FilterCell label="Property Type">
            <select value={propertyTypeSlug} onChange={(e) => setPropertyTypeSlug(e.target.value)} className={fieldClasses}>
              <option value="">Any Type</option>
              {typesInSelectedCategory.map((type) => (
                <option key={type.slug} value={type.slug}>
                  {type.label}
                </option>
              ))}
            </select>
          </FilterCell>
          <FilterCell label={`Area (${areaUnit})`}>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={minAreaValue}
                onChange={(e) => setMinAreaValue(e.target.value)}
                placeholder="0"
                className={`${fieldClasses} w-10`}
              />
              <span className="text-xs text-white/40">to</span>
              <input
                type="number"
                min="0"
                value={maxAreaValue}
                onChange={(e) => setMaxAreaValue(e.target.value)}
                placeholder="Any"
                className={`${fieldClasses} w-10`}
              />
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                className={`${fieldClasses} w-auto shrink-0 text-white/60`}
              >
                {AREA_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </FilterCell>
        </div>

        <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
          <FilterCell label="Price (PKR)">
            <div className="flex items-center gap-1.5">
              <select
                value={minPrice}
                onChange={(e) => {
                  const nextMin = e.target.value;
                  // Selecting a Min above the current Max clears Max instead
                  // of silently sending minPrice > maxPrice to the API.
                  if (maxPrice && Number(maxPrice) <= Number(nextMin)) setMaxPrice('');
                  setMinPrice(nextMin);
                }}
                className={`${fieldClasses} w-16`}
              >
                <option value="" className="text-black">No Min</option>
                {PRICE_OPTIONS.map((p) => (
                  <option key={p} value={p} className="text-black">
                    {priceOptionLabel(p)}
                  </option>
                ))}
              </select>
              <span className="text-xs text-white/40">to</span>
              <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={`${fieldClasses} w-16`}>
                <option value="" className="text-black">Any</option>
                {PRICE_OPTIONS.filter((p) => !minPrice || p > Number(minPrice)).map((p) => (
                  <option key={p} value={p} className="text-black">
                    {priceOptionLabel(p)}
                  </option>
                ))}
              </select>
            </div>
          </FilterCell>
          <FilterCell label="Beds">
            <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={fieldClasses}>
              <option value="">All</option>
              {BED_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </FilterCell>
          <FilterCell label="Baths">
            <select value={minBathrooms} onChange={(e) => setMinBathrooms(e.target.value)} className={fieldClasses}>
              <option value="">All</option>
              {BATH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </FilterCell>
          <FilterCell label="Keyword">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. corner plot" className={fieldClasses} />
          </FilterCell>
          <FilterCell label="More Options" className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-white"
            >
              {moreSelectedCount > 0 ? `${moreSelectedCount} Selected` : '0 Selected'}
              <ChevronDown className="h-4 w-4 text-white/50" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-64 space-y-3 rounded-lg border border-border bg-background p-4 text-foreground shadow-xl">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Furnishing</span>
                  <select
                    value={furnishingStatus}
                    onChange={(e) => setFurnishingStatus(e.target.value as FurnishingStatus | '')}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="">Any</option>
                    {FURNISHING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={hasVideo} onChange={(e) => setHasVideo(e.target.checked)} />
                  Has video tour
                </label>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="w-full rounded-md bg-primary py-1.5 text-sm font-medium text-primary-foreground"
                >
                  Done
                </button>
              </div>
            )}
          </FilterCell>
        </div>
      </div>

      {isLoading && <p>Loading…</p>}

      <ul className="grid gap-4 sm:grid-cols-2">
        {listings.map((listing) => (
          <li key={listing.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-medium">{listing.title}</h2>
            <p className="text-sm text-slate-500">
              {listing.propertyType?.label} · {listing.area}, {listing.city} —{' '}
              {formatPrice(Number(listing.price))}
            </p>
            <p className="text-xs text-slate-400">
              {listing.bedrooms ?? '–'} bed · {listing.bathrooms ?? '–'} bath · {listing.areaValue} {listing.areaUnit}
            </p>
            <ContactActions listing={listing} />
          </li>
        ))}
        {isError && (
          <p className="text-red-600">Couldn&apos;t load listings — please try again in a moment.</p>
        )}
        {!isLoading && !isError && listings.length === 0 && <p className="text-slate-500">No verified listings yet.</p>}
      </ul>
    </main>
  );
}
