'use client';

import { useEffect, useRef, useState } from 'react';
import { PAKISTAN_CITIES, useTaxonomyViewModel, type AreaUnit, type ListingPosterType } from '@jayedaad/core';
import { Checkbox, Select, cn } from '@jayedaad/ui-web';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';
import { PRICE_OPTIONS, priceOptionLabel } from '@/lib/priceOptions';
import { AREA_UNIT_OPTIONS, AREA_UNITS, areaUnitLabel } from '@/lib/areaOptions';

export interface ListingFiltersState {
  city: string;
  area: string;
  minPrice: string;
  maxPrice: string;
  minAreaValue: string;
  maxAreaValue: string;
  areaUnit: AreaUnit;
  categorySlug: string;
  propertyTypeSlugs: string[];
  minBedrooms: number | null;
  minBathrooms: number | null;
  verifiedOnly: boolean;
  furnished: boolean;
  newProjects: boolean;
  readyToMove: boolean;
  amenities: string[];
  // Who posted the listing — Owner, (independent) Agent, or Agency. '' means
  // no filter (any poster type). Backed by the stored listings.poster_type
  // column, filtered server-side (see ListingsBrowser's baseFilters).
  posterType: ListingPosterType | '';
}

export const DEFAULT_LISTING_FILTERS: ListingFiltersState = {
  city: '',
  area: '',
  minPrice: '',
  maxPrice: '',
  minAreaValue: '',
  maxAreaValue: '',
  areaUnit: 'marla',
  categorySlug: '',
  propertyTypeSlugs: [],
  minBedrooms: null,
  minBathrooms: null,
  verifiedOnly: false,
  furnished: false,
  newProjects: false,
  readyToMove: false,
  amenities: [],
  posterType: '',
};

const POSTER_TYPE_OPTIONS: { value: ListingPosterType; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'agent', label: 'Agent' },
  { value: 'agency', label: 'Agency' },
];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6];
const BATHROOM_OPTIONS = [1, 2, 3, 4, 5];

// Karachi is conventionally advertised/measured in Sq. Yards, every other
// city in Marla — same convention Zameen/Graana follow. Everywhere else
// falls back to the Marla list.
const QUICK_CITIES = ['Karachi', 'Lahore', 'Islamabad'];
const MARLA_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 3, label: '3 Marla' },
  { value: 5, label: '5 Marla' },
  { value: 8, label: '8 Marla' },
  { value: 10, label: '10 Marla' },
  { value: 20, label: '20 Marla (1 Kanal)' },
];
const SQYD_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 120, label: '120 Sq. Yd' },
  { value: 200, label: '200 Sq. Yd' },
  { value: 240, label: '240 Sq. Yd' },
  { value: 300, label: '300 Sq. Yd' },
  { value: 500, label: '500 Sq. Yd' },
  { value: 1000, label: '1000 Sq. Yd' },
];

// The four quick-pick buckets from the reference design. Houses/Flats map
// to their real property-type slugs (supabase/migrations/0005_taxonomy_
// seed.sql); Plots/Commercial map to their whole category since "Plots"/
// "Commercial" as a quick pick is broader than any single type — matches
// how PropertySearchBar/HeroSearchCard's quick pickers already treat
// propertyTypeSlug vs. propertyTypeCategory. Purely a friendlier layer over
// the same categorySlug/propertyTypeSlugs fields the Category/Property Type
// dropdowns below already read and write — picking a chip here shows up in
// those dropdowns too, and vice versa, so neither path is more "correct"
// than the other.
type QuickPropertyType = 'houses' | 'flats' | 'plots' | 'commercial';
const QUICK_PROPERTY_TYPES: { key: QuickPropertyType; label: string; categorySlug: string; propertyTypeSlugs: string[] }[] = [
  { key: 'houses', label: 'Houses', categorySlug: 'residential', propertyTypeSlugs: ['house'] },
  { key: 'flats', label: 'Flats', categorySlug: 'residential', propertyTypeSlugs: ['flat'] },
  { key: 'plots', label: 'Plots', categorySlug: 'plot', propertyTypeSlugs: [] },
  { key: 'commercial', label: 'Commercial', categorySlug: 'commercial', propertyTypeSlugs: [] },
];

// Commercial's own quick sub-types. "Plots" here means commercial plots —
// seeded as property_types.slug 'commercial_plot' under the *Plot* category,
// not Commercial (see 0005_taxonomy_seed.sql) — so this chip cuts across
// categories on purpose. "Plazas" has no dedicated seeded type; 'building'
// is the closest real one, so the chip aliases that label onto it rather
// than requiring a taxonomy migration for a fourth commercial type.
const COMMERCIAL_SUBTYPES: { label: string; slug: string }[] = [
  { label: 'Plots', slug: 'commercial_plot' },
  { label: 'Shops', slug: 'shop' },
  { label: 'Offices', slug: 'office' },
  { label: 'Plazas', slug: 'building' },
];

function getQuickPropertyType(filters: ListingFiltersState): QuickPropertyType | null {
  if (filters.categorySlug === 'residential' && filters.propertyTypeSlugs.length === 1) {
    if (filters.propertyTypeSlugs[0] === 'house') return 'houses';
    if (filters.propertyTypeSlugs[0] === 'flat') return 'flats';
  }
  if (filters.categorySlug === 'plot') return 'plots';
  if (filters.categorySlug === 'commercial') return 'commercial';
  return null;
}

const PREFERENCE_TOGGLES: { key: 'verifiedOnly' | 'furnished' | 'newProjects' | 'readyToMove'; label: string }[] = [
  { key: 'verifiedOnly', label: 'Verified only' },
  { key: 'furnished', label: 'Furnished' },
  { key: 'newProjects', label: 'New Projects' },
  { key: 'readyToMove', label: 'Ready to Move' },
];

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

interface PropertyFiltersProps {
  filters: ListingFiltersState;
  onChange: (filters: ListingFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
}

// Shared pill/chip button used for Property Type, Amenities, Bedrooms & Bathrooms
function Chip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

// Spacing between sections comes from the scroll container's own `gap`
// below — this only adds the divider line, not extra top padding, so
// sections aren't double-spaced (gap + padding stacking on top of each other).
function Section({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return <div className={first ? '' : 'border-t border-slate-100 pt-4'}>{children}</div>;
}

// Checkbox-list dropdown used for Property Type & Amenities — same
// button/panel look as the ui-web <Select> used for City & Category above
// (rounded-full trigger, rounded-md listbox panel with the same border/
// shadow/hover tokens), just with checkboxes instead of single-select.
function MultiSelectDropdown({
  options,
  selected,
  onToggle,
  placeholder,
  emptyMessage,
}: {
  options: { key: string; value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder: string;
  emptyMessage: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
        : `${selected.length} selected`;

  return (
    <div ref={containerRef} className="relative mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-full border border-slate-200 bg-background px-4 py-2 text-left text-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className={cn('truncate', selected.length === 0 && 'text-muted-foreground')}>{summary}</span>
        <ChevronIcon open={open} />
      </button>

      <ul
        role="listbox"
        className={cn(
          'absolute z-50 mt-1.5 max-h-60 w-full origin-top overflow-auto rounded-md border border-border bg-background p-1 shadow-lg transition-all duration-150 ease-out',
          open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-1 scale-95 opacity-0',
        )}
      >
        {options.length === 0 ? (
          <li className="px-2.5 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
        ) : (
          options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <li key={option.key} role="option" aria-selected={checked}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors hover:bg-muted',
                    checked ? 'text-primary' : 'text-foreground',
                  )}
                >
                  <Checkbox checked={checked} onChange={() => onToggle(option.value)} />
                  <span className="truncate">{option.label}</span>
                </label>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

// Same chevron glyph as ui-web's <Select>, kept local since it isn't exported.
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function PropertyFilters({ filters, onChange, onApply, onReset }: PropertyFiltersProps) {
  const set = <K extends keyof ListingFiltersState>(key: K, value: ListingFiltersState[K]) =>
    onChange({ ...filters, [key]: value });

  // Price slider is index-based over PRICE_OPTIONS: index 0 == "No Min",
  // the last index == "Any Price" (max), both stored as '' in filters.
  const priceMaxIndex = PRICE_OPTIONS.length - 1;
  const minIndex = filters.minPrice ? Math.max(0, PRICE_OPTIONS.indexOf(Number(filters.minPrice))) : 0;
  const maxIndex = filters.maxPrice ? Math.max(0, PRICE_OPTIONS.indexOf(Number(filters.maxPrice))) : priceMaxIndex;
  const minPercent = (minIndex / priceMaxIndex) * 100;
  const maxPercent = (maxIndex / priceMaxIndex) * 100;

  const handleMinIndexChange = (idx: number) => {
    const clamped = Math.min(idx, maxIndex);
    onChange({ ...filters, minPrice: clamped === 0 ? '' : String(PRICE_OPTIONS[clamped]) });
  };
  const handleMaxIndexChange = (idx: number) => {
    const clamped = Math.max(idx, minIndex);
    onChange({ ...filters, maxPrice: clamped === priceMaxIndex ? '' : String(PRICE_OPTIONS[clamped]) });
  };

  // Area slider is index-based over the unit's preset band, same pattern as
  // the price slider above — index 0 == "No Min", the last index == "Any"
  // (max), both stored as '' in filters.
  const areaOptions = AREA_UNIT_OPTIONS[filters.areaUnit];
  const areaMaxIndex = areaOptions.length - 1;
  const minAreaIndex = filters.minAreaValue ? Math.max(0, areaOptions.indexOf(Number(filters.minAreaValue))) : 0;
  const maxAreaIndex = filters.maxAreaValue
    ? Math.max(0, areaOptions.indexOf(Number(filters.maxAreaValue)))
    : areaMaxIndex;
  const minAreaPercent = (minAreaIndex / areaMaxIndex) * 100;
  const maxAreaPercent = (maxAreaIndex / areaMaxIndex) * 100;

  const handleMinAreaIndexChange = (idx: number) => {
    const clamped = Math.min(idx, maxAreaIndex);
    onChange({ ...filters, minAreaValue: clamped === 0 ? '' : String(areaOptions[clamped]) });
  };
  const handleMaxAreaIndexChange = (idx: number) => {
    const clamped = Math.max(idx, minAreaIndex);
    onChange({ ...filters, maxAreaValue: clamped === areaMaxIndex ? '' : String(areaOptions[clamped]) });
  };
  // Each unit has its own scale (Marla vs. Sq. Ft aren't comparable), so a
  // unit switch resets the range rather than keeping indices that would now
  // point at a wildly different value.
  const handleAreaUnitChange = (unit: AreaUnit) => {
    onChange({ ...filters, areaUnit: unit, minAreaValue: '', maxAreaValue: '' });
  };

  const { propertyTypes } = useTaxonomyViewModel();
  const { amenities } = useTaxonomyViewModel(filters.categorySlug || undefined);

  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);
  const typesInSelectedCategory = filters.categorySlug
    ? propertyTypes.filter((t) => t.category?.slug === filters.categorySlug)
    : propertyTypes;

  const quickPropertyType = getQuickPropertyType(filters);

  const selectQuickPropertyType = (type: (typeof QUICK_PROPERTY_TYPES)[number]) => {
    if (quickPropertyType === type.key) {
      onChange({ ...filters, categorySlug: '', propertyTypeSlugs: [], amenities: [] });
    } else {
      onChange({ ...filters, categorySlug: type.categorySlug, propertyTypeSlugs: type.propertyTypeSlugs, amenities: [] });
    }
  };

  const selectCommercialSubtype = (slug: string) => {
    const active = filters.propertyTypeSlugs.length === 1 && filters.propertyTypeSlugs[0] === slug;
    set('propertyTypeSlugs', active ? [] : [slug]);
  };

  // Houses/Plots' size quick-picks — Sq. Yd for Karachi (its listings are
  // conventionally advertised that way), Marla everywhere else. Same "N+"
  // open-ended-minimum convention as the Bedroom/Bathroom chips below,
  // rather than an exact min=max match, since real listings rarely land on
  // an exact plot size.
  const sizeUnit: AreaUnit = filters.city === 'Karachi' ? 'sqyd' : 'marla';
  const sizeOptions = sizeUnit === 'sqyd' ? SQYD_SIZE_OPTIONS : MARLA_SIZE_OPTIONS;
  const selectSize = (value: number) => {
    const active = filters.areaUnit === sizeUnit && filters.minAreaValue === String(value);
    onChange({
      ...filters,
      areaUnit: sizeUnit,
      minAreaValue: active ? '' : String(value),
      maxAreaValue: active ? filters.maxAreaValue : '',
    });
  };

  // Bedroom/bathroom counts are meaningless for Plots and Commercial —
  // hidden rather than shown-but-inapplicable once one of those is picked.
  const showBedBath = quickPropertyType !== 'plots' && quickPropertyType !== 'commercial';

  return (
    // Sticky + height-capped on desktop so the panel never grows taller
    // than the viewport (it easily can, with this many sections) — content
    // scrolls inside it while Reset/Apply stay pinned at the bottom,
    // visible without scrolling. Plain in-flow on mobile, where the panel
    // is stacked above the results rather than side-by-side.
    <aside className="flex w-full flex-col rounded-3xl border border-slate-100 bg-white shadow-sm lg:sticky lg:top-24">
      {/* max-height (not height) lives on THIS scrollable content div, not
          the outer <aside> — capping it here only ever bounds the content,
          it never forces the card to grow past what its content actually
          needs. Capping the outer <aside> instead made it always claim the
          full calc(100vh-7rem) box regardless of how short the content
          was, leaving a blank gap above Reset/Apply on any filter set that
          didn't fill the viewport. */}
      <div className="flex flex-col gap-4 overflow-y-auto p-5 lg:max-h-[calc(100vh-7rem-4.75rem)]">
      {/* Price Range — dual min/max slider */}
      <Section first>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price Range (PKR)</h3>
          <span className="text-xs font-medium text-slate-600">
            {filters.minPrice ? priceOptionLabel(Number(filters.minPrice)) : 'No Min'}
            {' – '}
            {filters.maxPrice ? priceOptionLabel(Number(filters.maxPrice)) : 'Any'}
          </span>
        </div>

        <div className="relative mt-5 h-4">
          {/* base track */}
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
          {/* selected range fill */}
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-heading-gradient"
            style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
          />

          <input
            type="range"
            min={0}
            max={priceMaxIndex}
            step={1}
            value={minIndex}
            onChange={(e) => handleMinIndexChange(Number(e.target.value))}
            aria-label="Minimum price"
            className="pointer-events-none absolute inset-0 z-20 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
          />
          <input
            type="range"
            min={0}
            max={priceMaxIndex}
            step={1}
            value={maxIndex}
            onChange={(e) => handleMaxIndexChange(Number(e.target.value))}
            aria-label="Maximum price"
            className="pointer-events-none absolute inset-0 z-30 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
          />
        </div>

        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
          <span>{priceOptionLabel(PRICE_OPTIONS[0])}</span>
          <span>{priceOptionLabel(PRICE_OPTIONS[priceMaxIndex])}+</span>
        </div>
      </Section>

      {/* Area Range — dual min/max slider, same pattern as Price Range */}
      <Section>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Area Range</h3>
          <Select
            value={filters.areaUnit}
            onChange={(e) => handleAreaUnitChange(e.target.value as AreaUnit)}
            className="w-24 shrink-0 rounded-full border-slate-200 px-3 py-1.5 text-xs"
          >
            {AREA_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {areaUnitLabel(unit)}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-1 text-xs font-medium text-slate-600">
          {filters.minAreaValue ? `${filters.minAreaValue} ${areaUnitLabel(filters.areaUnit)}` : 'No Min'}
          {' – '}
          {filters.maxAreaValue ? `${filters.maxAreaValue} ${areaUnitLabel(filters.areaUnit)}` : 'Any'}
        </div>

        <div className="relative mt-4 h-4">
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-heading-gradient"
            style={{ left: `${minAreaPercent}%`, right: `${100 - maxAreaPercent}%` }}
          />

          <input
            type="range"
            min={0}
            max={areaMaxIndex}
            step={1}
            value={minAreaIndex}
            onChange={(e) => handleMinAreaIndexChange(Number(e.target.value))}
            aria-label="Minimum area"
            className="pointer-events-none absolute inset-0 z-20 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
          />
          <input
            type="range"
            min={0}
            max={areaMaxIndex}
            step={1}
            value={maxAreaIndex}
            onChange={(e) => handleMaxAreaIndexChange(Number(e.target.value))}
            aria-label="Maximum area"
            className="pointer-events-none absolute inset-0 z-30 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
          />
        </div>

        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
          <span>{areaOptions[0]}</span>
          <span>{areaOptions[areaMaxIndex]}+</span>
        </div>
      </Section>

      {/* City — Karachi/Lahore/Islamabad as one-click chips (the common
          case), with the full dropdown right below for every other city or
          to go back to Any City. Both read/write the same `city` field, so
          they're always in sync with each other. */}
      <Section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">City</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_CITIES.map((city) => (
            <Chip key={city} active={filters.city === city} onClick={() => set('city', filters.city === city ? '' : city)}>
              {city}
            </Chip>
          ))}
        </div>
        <Select
          value={filters.city}
          onChange={(e) => set('city', e.target.value)}
          className="mt-2 w-full rounded-full border-slate-200 px-4 py-2 text-sm"
        >
          <option value="">Any City</option>
          {PAKISTAN_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Section>

      {/* Area / Location */}
      <Section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Area / Location</h3>
        <PlacesAutocompleteInput
          value={filters.area}
          onChange={(v) => set('area', v)}
          placeholder="e.g. Bahria Town, DHA"
          className="mt-3 rounded-full border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary"
        />
      </Section>

      {/* Property Type — Houses/Flats/Plots/Commercial quick chips cover the
          common case in one click; Category + the checkbox dropdown below
          stay fully functional for anything more specific (Penthouse,
          Warehouse, mixing multiple types, etc.) and read/write the exact
          same categorySlug/propertyTypeSlugs fields, so picking either way
          shows up in both. */}
      <Section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Property Type</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PROPERTY_TYPES.map((type) => (
            <Chip key={type.key} active={quickPropertyType === type.key} onClick={() => selectQuickPropertyType(type)}>
              {type.label}
            </Chip>
          ))}
        </div>
      </Section>

      {/* Commercial's own sub-types — only appears once Commercial is
          picked above, cascading the search instead of showing every
          possible sub-type up front. */}
      {quickPropertyType === 'commercial' && (
        <Section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Commercial Type</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {COMMERCIAL_SUBTYPES.map((sub) => (
              <Chip
                key={sub.slug}
                active={filters.propertyTypeSlugs.length === 1 && filters.propertyTypeSlugs[0] === sub.slug}
                onClick={() => selectCommercialSubtype(sub.slug)}
              >
                {sub.label}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {/* Size — Houses/Plots only, cascading the same way. Sq. Yd for
          Karachi, Marla everywhere else (see sizeUnit above); same "N+"
          convention as Bedrooms/Bathrooms below. */}
      {(quickPropertyType === 'houses' || quickPropertyType === 'plots') && (
        <Section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizeOptions.map(({ value, label }) => (
              <Chip
                key={value}
                active={filters.areaUnit === sizeUnit && filters.minAreaValue === String(value)}
                onClick={() => selectSize(value)}
              >
                {label}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      <Section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</h3>
        <Select
          value={filters.categorySlug}
          onChange={(e) => onChange({ ...filters, categorySlug: e.target.value, propertyTypeSlugs: [], amenities: [] })}
          className="mt-3 w-full rounded-full border-slate-200 px-4 py-2 text-sm"
        >
          <option value="">Any Category</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </Select>
      </Section>

      {/* Property Type — checkbox dropdown, for exact/multi sub-type picks */}
      <Section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Property Type (exact)</h3>
        <MultiSelectDropdown
          options={typesInSelectedCategory.map((type) => ({ key: type.slug, value: type.slug, label: type.label }))}
          selected={filters.propertyTypeSlugs}
          onToggle={(value) => set('propertyTypeSlugs', toggleInList(filters.propertyTypeSlugs, value))}
          placeholder="Any Property Type"
          emptyMessage="Pick a category above to see property types."
        />
      </Section>

      {/* Bedrooms/Bathrooms — hidden for Plots/Commercial, where a room
          count doesn't apply. */}
      {showBedBath && (
        <Section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bedrooms</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {BEDROOM_OPTIONS.map((n) => (
              <Chip
                key={n}
                active={filters.minBedrooms === n}
                onClick={() => set('minBedrooms', filters.minBedrooms === n ? null : n)}
              >
                {n}+
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {showBedBath && (
        <Section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bathrooms</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {BATHROOM_OPTIONS.map((n) => (
              <Chip
                key={n}
                active={filters.minBathrooms === n}
                onClick={() => set('minBathrooms', filters.minBathrooms === n ? null : n)}
              >
                {n}+
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {/* Posted by — Owner / Agent / Agency */}
      <Section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posted By</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {POSTER_TYPE_OPTIONS.map(({ value, label }) => (
            <Chip
              key={value}
              active={filters.posterType === value}
              onClick={() => set('posterType', filters.posterType === value ? '' : value)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Section>

      {/* Preferences */}
      <Section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferences</h3>
        <div className="mt-3 flex flex-col gap-3">
          {PREFERENCE_TOGGLES.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center justify-between text-sm text-slate-700">
              {label}
              <span
                role="switch"
                aria-checked={filters[key]}
                onClick={() => set(key, !filters[key])}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  filters[key] ? 'bg-heading-gradient' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    filters[key] ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* Amenities — checkbox dropdown */}
      <Section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amenities</h3>
        <MultiSelectDropdown
          options={amenities.map((amenity) => ({ key: amenity.slug, value: amenity.label, label: amenity.label }))}
          selected={filters.amenities}
          onToggle={(value) => set('amenities', toggleInList(filters.amenities, value))}
          placeholder="Any Amenities"
          emptyMessage="Pick a category above to see its amenities."
        />
      </Section>
      </div>

      {/* Actions — outside the scroll area so it's always visible, not
          something you have to scroll the whole filter list to reach. */}
      <div className="flex shrink-0 gap-2 border-t border-slate-100 p-5">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-[2] rounded-full bg-heading-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}