'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PAKISTAN_CITIES, useTaxonomyViewModel, type AreaUnit } from '@jayedaad/core';
import {
  BedDouble,
  Briefcase,
  Building,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  Factory,
  FileText,
  Globe2,
  Home,
  LandPlot,
  Landmark,
  Layers,
  MapPin,
  MoreHorizontal,
  Search as SearchIcon,
  Sprout,
  Store,
  Warehouse,
} from 'lucide-react';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';
import { RangeDropdown } from '@/components/shared/PropertySearchBar';
import { PRICE_OPTIONS, priceOptionLabel } from '@/lib/priceOptions';
import { AREA_UNIT_OPTIONS, areaUnitLabel } from '@/lib/areaOptions';

type Purpose = 'buy' | 'rent';

// Quick-pick cities shown as their own buttons before the "All Cities"
// catch-all, same three biggest metros the mockup calls out by name. The
// "All Cities" button doubles as a dropdown trigger for the rest of
// PAKISTAN_CITIES — clicking it with no city picked yet opens a searchable
// list of every other city; selecting one there swaps the button's own
// label to that city (so it reads as "currently filtering by X") while
// still offering "All Cities" as the first, clear-the-filter option.
const QUICK_CITIES: { name: string; icon: typeof Landmark }[] = [
  { name: 'Lahore', icon: Landmark },
  { name: 'Karachi', icon: Building2 },
  { name: 'Islamabad', icon: Landmark },
];

interface SizePreset {
  label: string;
  value: number;
  unit: AreaUnit;
}

// Real Pakistani real-estate size conventions (Marla/Kanal for residential,
// Sq. Ft for commercial — same units lib/areaOptions.ts's AREA_UNIT_OPTIONS
// already scales for), one preset list per type that actually uses size as
// its primary spec. "N+" (open-ended: sets only minAreaValue, no max) rather
// than a narrow band — a homepage quick-pick should widen the result set,
// not accidentally exclude anything just above the picked number, and it
// keeps the same "at least N" mental model as the bedroom chips below.
const HOUSE_SIZE_PRESETS: SizePreset[] = [
  { label: '5 Marla+', value: 5, unit: 'marla' },
  { label: '10 Marla+', value: 10, unit: 'marla' },
  { label: '1 Kanal+', value: 1, unit: 'kanal' },
  { label: '2 Kanal+', value: 2, unit: 'kanal' },
];

const PLOT_SIZE_PRESETS: SizePreset[] = [
  { label: '5 Marla+', value: 5, unit: 'marla' },
  { label: '10 Marla+', value: 10, unit: 'marla' },
  { label: '1 Kanal+', value: 1, unit: 'kanal' },
  { label: '4 Kanal+', value: 4, unit: 'kanal' },
  { label: '8 Kanal+', value: 8, unit: 'kanal' },
];

const COMMERCIAL_SIZE_PRESETS: SizePreset[] = [
  { label: '500 Sq Ft+', value: 500, unit: 'sqft' },
  { label: '1000 Sq Ft+', value: 1000, unit: 'sqft' },
  { label: '2000 Sq Ft+', value: 2000, unit: 'sqft' },
  { label: '5000 Sq Ft+', value: 5000, unit: 'sqft' },
];

// Matches PropertyFilters.tsx's own BEDROOM_OPTIONS "N+" chips (1–6) —
// trimmed to 5 here since this is a quick-pick shortcut, not the full
// filter panel; "5+" still reaches every listing a "6" chip would've.
const BEDROOM_PRESETS = [1, 2, 3, 4, 5];

// The three real top-level categories (supabase/migrations/0005_taxonomy_
// seed.sql's property_type_categories, verified verbatim against Zameen's
// own dropdown — Homes/Plots/Commercial, no separate "Apartment" tab; Flat/
// Apartment is one of Homes' sub-types, same as Zameen). Each button opens a
// dropdown of its real sub-types (fetched from the taxonomy API below, not
// hardcoded — Super Admin can add/retire types at runtime) instead of only
// offering one hardcoded slug per button. Quick filters stay per-category:
// Homes gets both size AND bedroom count (a house/flat/room is shopped for
// on both specs), Plot/Commercial are size-only (no bedroom concept there).
const PROPERTY_CATEGORIES: {
  slug: string;
  label: string;
  icon: typeof Home;
  quickFilters: ('bedrooms' | 'size')[];
  sizePresets?: SizePreset[];
}[] = [
  { slug: 'residential', label: 'Homes', icon: Home, quickFilters: ['size', 'bedrooms'], sizePresets: HOUSE_SIZE_PRESETS },
  { slug: 'plot', label: 'Plots', icon: LandPlot, quickFilters: ['size'], sizePresets: PLOT_SIZE_PRESETS },
  { slug: 'commercial', label: 'Commercial', icon: Store, quickFilters: ['size'], sizePresets: COMMERCIAL_SIZE_PRESETS },
];

// One icon per real seeded sub-type slug — Building2 is the fallback for
// any slug not in this map (a type Super Admin adds later shouldn't crash
// this card, just render generically until someone updates this list).
const SUBTYPE_ICONS: Record<string, typeof Home> = {
  house: Home,
  flat: Building2,
  penthouse: Building,
  upper_portion: Layers,
  lower_portion: Layers,
  farm_house: Sprout,
  room: DoorOpen,
  residential_plot: LandPlot,
  commercial_plot: LandPlot,
  agricultural_land: Sprout,
  industrial_land: Factory,
  plot_file: FileText,
  plot_form: FileText,
  office: Briefcase,
  warehouse: Warehouse,
  building: Building,
  shop: Store,
  factory: Factory,
  other: MoreHorizontal,
};

function StepLabel({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-semibold text-foreground">
      {step}. {children}
    </span>
  );
}

// Homepage-only hero search card — the mockup's numbered City → Property
// Type/Area steps, all controls visible up front instead of the click-to-open
// dropdown panels PropertySearchBar uses elsewhere. Deliberately a separate
// component rather than a new PropertySearchBar variant: PropertySearchBar is
// shared by SearchHero (/listings, /developments, /agents, contact-us) and
// needs to keep its dropdown UI + Project/Developer fields for those pages,
// so this card only reuses its data sources (PAKISTAN_CITIES,
// PlacesAutocompleteInput, RangeDropdown) and the /listings query-param
// scheme, not its markup.
export function HeroSearchCard({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [purpose, setPurpose] = useState<Purpose>('buy');
  const [city, setCity] = useState('');
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const cityMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (cityMenuRef.current && !cityMenuRef.current.contains(e.target as Node)) setCityMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [cityMenuOpen]);

  const isQuickCity = QUICK_CITIES.some((q) => q.name === city);
  // The button reflects a non-quick city once one's picked from the
  // dropdown, so it reads as "currently filtering by X" instead of staying
  // stuck on the generic "All Cities" label.
  const otherCitiesFiltered = PAKISTAN_CITIES.filter(
    (c) => !QUICK_CITIES.some((q) => q.name === c) && c.toLowerCase().includes(citySearch.trim().toLowerCase()),
  );
  // Real sub-types, Super Admin-managed (see PROPERTY_CATEGORIES's comment)
  // — not hardcoded, same source ListingsBrowserSection/PropertyFilters
  // already read from.
  const { propertyTypes } = useTaxonomyViewModel();

  // Homes defaults selected — its quick-filter row (size + Beds) shows
  // immediately instead of requiring a click first.
  const [selectedCategory, setSelectedCategory] = useState(PROPERTY_CATEGORIES[0].slug);
  const [selectedSubtypeSlug, setSelectedSubtypeSlug] = useState<string | null>(null);
  const [openCategoryMenu, setOpenCategoryMenu] = useState<string | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState('');
  const [moreFilters, setMoreFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minArea, setMinArea] = useState<number | ''>('');
  const [maxArea, setMaxArea] = useState<number | ''>('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('marla');
  const [minBedrooms, setMinBedrooms] = useState<number | ''>('');
  const [bedsMenuOpen, setBedsMenuOpen] = useState(false);
  const bedsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bedsMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (bedsMenuRef.current && !bedsMenuRef.current.contains(e.target as Node)) setBedsMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [bedsMenuOpen]);

  useEffect(() => {
    if (!openCategoryMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) setOpenCategoryMenu(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openCategoryMenu]);

  const activeCategory = PROPERTY_CATEGORIES.find((c) => c.slug === selectedCategory)!;

  // Clicking the already-selected category's button just opens/closes its
  // own dropdown (so re-picking a different sub-type doesn't wipe the
  // current one first); clicking a *different* category commits the switch
  // immediately, back to "All {category}", and drops whichever contextual
  // quick-filter belonged to the category being left — carrying it forward
  // would silently keep narrowing the search (e.g. a bedroom count picked
  // under Homes still applying after switching to Plots).
  function handleCategoryClick(slug: string) {
    if (slug !== selectedCategory) {
      setSelectedCategory(slug);
      setSelectedSubtypeSlug(null);
      setMinBedrooms('');
      setMinArea('');
      setMaxArea('');
      setBedsMenuOpen(false);
    }
    setOpenCategoryMenu((cur) => (cur === slug ? null : slug));
  }

  function selectSubtype(slug: string, subtypeSlug: string | null) {
    setSelectedCategory(slug);
    setSelectedSubtypeSlug(subtypeSlug);
    setOpenCategoryMenu(null);
  }

  function handleSearch() {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (area.trim()) params.set('area', area.trim());
    if (selectedSubtypeSlug) params.set('propertyTypeSlug', selectedSubtypeSlug);
    else params.set('propertyTypeCategory', selectedCategory);
    if (minBedrooms !== '') params.set('minBedrooms', String(minBedrooms));
    if (minPrice !== '') params.set('minPrice', String(minPrice));
    if (maxPrice !== '') params.set('maxPrice', String(maxPrice));
    if (minArea !== '') params.set('minAreaValue', String(minArea));
    if (maxArea !== '') params.set('maxAreaValue', String(maxArea));
    if (minArea !== '' || maxArea !== '') params.set('areaUnit', areaUnit);
    params.set('purpose', purpose === 'rent' ? 'rent' : 'sale');
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <div className={`flex w-full flex-col items-center gap-4 ${className}`}>
      <div className="pointer-events-auto inline-flex items-center gap-1 self-center rounded-full border border-border bg-card p-1 shadow-sm">
        {(['buy', 'rent'] as Purpose[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPurpose(p)}
            className="relative rounded-full px-5 py-2 text-sm font-medium transition-transform duration-150 ease-out active:scale-90"
          >
            {purpose === p && (
              <motion.span
                layoutId="heroSearchCardPurposePill"
                initial={false}
                className="absolute inset-0 rounded-full bg-heading-gradient shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className={`relative z-10 ${purpose === p ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              {p === 'buy' ? 'Buy' : 'Rent'}
            </span>
          </button>
        ))}
      </div>

      <div className="w-full rounded-3xl bg-card p-5 shadow-2xl sm:p-6">
        <div className="mb-5">
          <StepLabel step={1}>City</StepLabel>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {QUICK_CITIES.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setCity((cur) => (cur === name ? '' : name))}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                  city === name
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                {name}
              </button>
            ))}
            <div ref={cityMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setCityMenuOpen((v) => !v)}
                className={`flex w-full flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                  city === '' || !isQuickCity
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Globe2 className="h-5 w-5" />
                <span className="truncate">{city && !isQuickCity ? city : 'All Cities'}</span>
              </button>

              {cityMenuOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg sm:w-64">
                  <div className="border-b border-border p-2">
                    <input
                      autoFocus
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Search cities…"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCity('');
                        setCityMenuOpen(false);
                        setCitySearch('');
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted"
                    >
                      All Cities
                      {city === '' && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                    {otherCitiesFiltered.length === 0 ? (
                      <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches.</p>
                    ) : (
                      otherCitiesFiltered.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCity(c);
                            setCityMenuOpen(false);
                            setCitySearch('');
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                        >
                          {c}
                          {city === c && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.3fr_1fr] sm:gap-6">
          <div>
            <StepLabel step={2}>Property Type</StepLabel>
            <div
              ref={categoryMenuRef}
              className={`grid gap-2.5 ${activeCategory.quickFilters.includes('bedrooms') ? 'grid-cols-4' : 'grid-cols-3'}`}
            >
              {PROPERTY_CATEGORIES.map((cat) => {
                // "Homes"/"Plots"/"Commercial" once nothing narrower is
                // picked (or a different category is active); the specific
                // sub-type's own label once one's chosen within this
                // category — reads as "currently filtering by X", same
                // pattern the city dropdown above already uses.
                const subtypesInCategory = propertyTypes.filter((t) => t.category.slug === cat.slug);
                const selectedSubtype =
                  selectedCategory === cat.slug && selectedSubtypeSlug
                    ? subtypesInCategory.find((t) => t.slug === selectedSubtypeSlug)
                    : undefined;
                const isActive = selectedCategory === cat.slug;

                return (
                  <div key={cat.slug} className="relative">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(cat.slug)}
                      className={`flex w-full flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                        isActive ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <cat.icon className="h-5 w-5" />
                      <span className="truncate">{selectedSubtype?.label ?? cat.label}</span>
                    </button>

                    {openCategoryMenu === cat.slug && (
                      <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-lg">
                        <button
                          type="button"
                          onClick={() => selectSubtype(cat.slug, null)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                            isActive && !selectedSubtypeSlug ? 'text-primary' : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          All {cat.label}
                          {isActive && !selectedSubtypeSlug && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <div className="mt-1 grid grid-cols-2 gap-1.5">
                          {subtypesInCategory.map((t) => {
                            const SubIcon = SUBTYPE_ICONS[t.slug] ?? Building2;
                            const active = isActive && selectedSubtypeSlug === t.slug;
                            return (
                              <button
                                key={t.slug}
                                type="button"
                                onClick={() => selectSubtype(cat.slug, t.slug)}
                                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                                  active
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                <SubIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{t.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sits in the same card-styled row as Homes/Plots/Commercial
                  (not a small pill below it) — only Homes carries a
                  bedroom concept, so this slot only exists while it's the
                  active category, right after Commercial. */}
              {activeCategory.quickFilters.includes('bedrooms') && (
                <div ref={bedsMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setBedsMenuOpen((v) => !v)}
                    className={`flex w-full flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                      minBedrooms !== ''
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <BedDouble className="h-5 w-5" />
                    <span className="truncate">{minBedrooms !== '' ? `${minBedrooms}+ Beds` : 'Beds'}</span>
                  </button>

                  {bedsMenuOpen && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-lg">
                      <p className="mb-2 text-xs font-semibold text-foreground">Bedrooms</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {BEDROOM_PRESETS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setMinBedrooms((cur) => (cur === n ? '' : n));
                              setBedsMenuOpen(false);
                            }}
                            className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                              minBedrooms === n
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {n}+
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setBedsMenuOpen(false)}
                        className="mt-2.5 w-full rounded-lg bg-heading-gradient px-3 py-1.5 text-xs font-medium text-primary-foreground"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Common filters for the selected category — bedroom count and
                typical Marla/Kanal/Sq.Ft sizes for Homes, size only for
                Plot/Commercial, matching how these are actually shopped for
                on Zameen/Graana rather than a generic min/max box. A plain
                opacity/y fade (no height animation) deliberately — a
                height-animated wrapper needs overflow-hidden while it's
                animating, and that clipped the Beds popover below it,
                making it look like the dropdown wasn't opening at all. */}
            <AnimatePresence initial={false}>
              {activeCategory && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
  {/* Size stays inline chips here — bedrooms moved up into the same
                      card row as Homes/Plots/Commercial, right after
                      Commercial. */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {activeCategory.quickFilters.includes('size') &&
                      activeCategory.sizePresets?.map((preset) => {
                        const active = minArea === preset.value && maxArea === '' && areaUnit === preset.unit;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              if (active) {
                                setMinArea('');
                              } else {
                                setMinArea(preset.value);
                                setMaxArea('');
                                setAreaUnit(preset.unit);
                              }
                            }}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              active
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <StepLabel step={3}>Area / Society</StepLabel>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-border px-3 py-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <PlacesAutocompleteInput
                  value={area}
                  onChange={setArea}
                  placeholder="e.g. DHA, Bahria Town, Gulberg…"
                  className="h-auto w-full border-none bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-heading-gradient px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:translate-y-0 active:scale-95"
              >
                <SearchIcon className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => setMoreFilters((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-primary transition-transform duration-150 ease-out active:scale-95"
          >
            {moreFilters ? 'Less Filters' : 'More Filters'}
            {moreFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        <AnimatePresence>
          {moreFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-5 border-t border-border pt-4 sm:grid-cols-2">
                <div>
                  <span className="mb-2 block text-xs font-semibold text-foreground">Budget Range</span>
                  <RangeDropdown
                    minValue={minPrice}
                    maxValue={maxPrice}
                    options={PRICE_OPTIONS}
                    formatOption={priceOptionLabel}
                    onChangeMin={setMinPrice}
                    onChangeMax={setMaxPrice}
                  />
                </div>
                <div>
                  <span className="mb-2 block text-xs font-semibold text-foreground">Area Range</span>
                  <RangeDropdown
                    minValue={minArea}
                    maxValue={maxArea}
                    options={AREA_UNIT_OPTIONS[areaUnit]}
                    formatOption={(v) => String(v)}
                    onChangeMin={setMinArea}
                    onChangeMax={setMaxArea}
                    unit={{ value: areaUnit, onChange: setAreaUnit }}
                  />
                  <span className="mt-1 block text-[11px] text-muted-foreground">Unit: {areaUnitLabel(areaUnit)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
