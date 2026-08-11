'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  developersRepository,
  PAKISTAN_CITIES,
  projectsRepository,
  useTaxonomyViewModel,
  type AreaUnit,
} from '@jayedaad/core';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Home,
  Locate,
  MapPin,
  Ruler,
  Search as SearchIcon,
  User2,
  Wallet,
  X,
} from 'lucide-react';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';
import { PRICE_OPTIONS, priceOptionLabel } from '@/lib/priceOptions';
import { AREA_UNITS, AREA_UNIT_OPTIONS, areaUnitLabel } from '@/lib/areaOptions';
import { useClickOutside } from '@/lib/useClickOutside';

export type SearchBarPurpose = 'buy' | 'rent';
// 'listings' searches GET /listings (via /buy-sell or /rent, chosen by the
// Buy/Rent tab below) — no Project/Developer fields (listings don't have
// either). 'projects' searches GET /projects (via /developments) — no
// purpose (projects are never "for rent"), but gains the Project Title /
// Developer fields GET /projects actually supports (see ProjectSearchFilters
// in packages/core/models).
// 'agencies' renders the same base fields as neither 'listings' nor
// 'projects' (no Buy/Rent toggle, no project-specific "See More" section) —
// used by the /agents hero, which reuses this search bar for its city/area
// fields without wanting either variant's extra UI.
export type SearchBarVariant = 'listings' | 'projects' | 'agencies';

interface PropertySearchBarProps {
  variant?: SearchBarVariant;
  defaultPurpose?: SearchBarPurpose;
  className?: string;
  showPurposeToggle?: boolean;
}

const FIELD_BUTTON =
  'flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left sm:px-5';

function optionClass(active: boolean) {
  return `w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${active ? 'bg-primary/10 font-medium text-primary' : 'text-slate-600 hover:bg-slate-50'
    }`;
}

// Shared floating-panel shell every field below renders its own content
// into — handles the trigger button, the label/value display, and closing
// on an outside click. Only one field is ever open at once (governed by the
// parent's openField/onToggle).
function FilterField({
  icon: Icon,
  label,
  valueLabel,
  placeholder,
  open,
  onToggle,
  children,
  panelClassName = 'w-72',
  wrapperClassName = 'flex-1',
  last = false,
}: {
  icon: typeof MapPin;
  label: string;
  valueLabel: string;
  placeholder: string;
  open: boolean;
  onToggle: (next: boolean) => void;
  children: React.ReactNode;
  panelClassName?: string;
  wrapperClassName?: string;
  last?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => onToggle(false), open);

  return (
    <div
      ref={ref}
      className={`relative ${wrapperClassName} border-b border-slate-100 sm:border-b-0 sm:border-r sm:border-slate-100 ${last ? 'sm:border-r-0' : ''}`}
    >
      <button type="button" onClick={() => onToggle(!open)} className={FIELD_BUTTON}>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <Icon className="h-3.5 w-3.5 text-primary" />
          {label}
        </span>
        <span className={`truncate text-sm ${valueLabel ? 'font-medium text-primary' : 'text-slate-400'}`}>
          {valueLabel || placeholder}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full z-30 mt-2 max-w-[90vw] rounded-2xl border border-slate-100 bg-white p-4 text-slate-800 shadow-2xl ${last ? 'right-0' : 'left-0'
              } ${panelClassName}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RangeDropdown({
  minValue,
  maxValue,
  options,
  formatOption,
  onChangeMin,
  onChangeMax,
  unit,
}: {
  minValue: number | '';
  maxValue: number | '';
  options: number[];
  formatOption: (v: number) => string;
  onChangeMin: (v: number | '') => void;
  onChangeMax: (v: number | '') => void;
  unit?: { value: AreaUnit; onChange: (v: AreaUnit) => void };
}) {
  const maxOptions = options.filter((o) => minValue === '' || o > minValue);
  return (
    <div className="w-full">
      {unit && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</span>
          <select
            value={unit.value}
            onChange={(e) => unit.onChange(e.target.value as AreaUnit)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none"
          >
            {AREA_UNITS.map((u) => (
              <option key={u} value={u}>
                {areaUnitLabel(u)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="number"
          min={0}
          placeholder="0"
          value={minValue}
          onChange={(e) => onChangeMin(e.target.value ? Number(e.target.value) : '')}
          className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <span className="shrink-0 text-xs text-slate-400">To</span>
        <input
          type="number"
          min={0}
          placeholder="Any"
          value={maxValue}
          onChange={(e) => onChangeMax(e.target.value ? Number(e.target.value) : '')}
          className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="max-h-40 space-y-0.5 overflow-y-auto pr-1">
          <button type="button" onClick={() => onChangeMin('')} className={optionClass(minValue === '')}>
            0
          </button>
          {options.map((o) => (
            <button key={o} type="button" onClick={() => onChangeMin(o)} className={optionClass(minValue === o)}>
              {formatOption(o)}
            </button>
          ))}
        </div>
        <div className="max-h-40 space-y-0.5 overflow-y-auto pr-1">
          <button type="button" onClick={() => onChangeMax('')} className={optionClass(maxValue === '')}>
            Any
          </button>
          {maxOptions.map((o) => (
            <button key={o} type="button" onClick={() => onChangeMax(o)} className={optionClass(maxValue === o)}>
              {formatOption(o)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Zameen-style hero search — City/Property Type/Budget/Area dropdowns (real
// data, not placeholder option lists), a Buy/Rent purpose toggle, and a "See
// more" row for Project Title/Developer (projects variant only, since GET
// /projects — not /listings — is what actually supports those two filters;
// see ProjectSearchFilters in packages/core/src/models/index.ts). Shared by
// the homepage Hero and every SearchHero-backed page (/listings,
// /developments) so there's exactly one search bar implementation instead of
// three divergent copies.
export function PropertySearchBar({
  variant = 'listings',
  defaultPurpose = 'buy',
  className = '',
  showPurposeToggle = true,
}: PropertySearchBarProps) {
  const router = useRouter();
  const [purpose, setPurpose] = useState<SearchBarPurpose>(defaultPurpose);
  const [openField, setOpenField] = useState<string | null>(null);
  const [seeMore, setSeeMore] = useState(false);

  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [area, setArea] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [propertyTypeSlug, setPropertyTypeSlug] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minArea, setMinArea] = useState<number | ''>('');
  const [maxArea, setMaxArea] = useState<number | ''>('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('marla');
  const [keyword, setKeyword] = useState('');
  const [developerInput, setDeveloperInput] = useState('');
  const [developerSlug, setDeveloperSlug] = useState('');

  const toggleField = (key: string) => setOpenField((cur) => (cur === key ? null : key));

  // Full static list, same as every other City dropdown in the app — the
  // previous per-variant live query (GET /listings/locations/cities or
  // GET /projects/cities) only ever showed cities that already had a
  // listing/project, sparse on a fresh dataset.
  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    return q ? PAKISTAN_CITIES.filter((c) => c.toLowerCase().includes(q)) : PAKISTAN_CITIES;
  }, [citySearch]);

  const { propertyTypes } = useTaxonomyViewModel();
  const categories = useMemo(
    () =>
      propertyTypes.reduce<{ slug: string; label: string }[]>((acc, t) => {
        if (t.category && !acc.some((c) => c.slug === t.category.slug)) acc.push(t.category);
        return acc;
      }, []),
    [propertyTypes],
  );
  const activeCategoryTab = categorySlug || categories[0]?.slug;
  const typesInActiveCategory = propertyTypes.filter((t) => t.category?.slug === activeCategoryTab);
  const selectedTypeLabel = propertyTypes.find((t) => t.slug === propertyTypeSlug)?.label ?? '';

  const projectSuggestQuery = useQuery({
    queryKey: ['searchbar', 'project-suggest', keyword],
    queryFn: () => projectsRepository.searchPublic({ keyword, pageSize: 6 }),
    enabled: variant === 'projects' && openField === 'project' && keyword.trim().length >= 2,
    staleTime: 30_000,
  });

  const developersQuery = useQuery({
    queryKey: ['searchbar', 'developers'],
    // Called with no filters -> the unpaginated array branch of the
    // dual-mode endpoint (see developers.repository.ts::list).
    queryFn: () => developersRepository.list(),
    select: (data) => (Array.isArray(data) ? data : data.items),
    enabled: variant === 'projects',
    staleTime: 5 * 60_000,
  });
  const developerMatches = useMemo(() => {
    const q = developerInput.trim().toLowerCase();
    if (!q) return [];
    return (developersQuery.data ?? []).filter((d) => d.name.toLowerCase().includes(q)).slice(0, 6);
  }, [developersQuery.data, developerInput]);

  const areaOptions = AREA_UNIT_OPTIONS[areaUnit];
  const budgetLabel =
    minPrice === '' && maxPrice === ''
      ? ''
      : `${minPrice === '' ? '0' : priceOptionLabel(minPrice)} – ${maxPrice === '' ? 'Any' : priceOptionLabel(maxPrice)}`;
  const areaLabel =
    minArea === '' && maxArea === '' ? '' : `${minArea === '' ? '0' : minArea} – ${maxArea === '' ? 'Any' : maxArea} ${areaUnitLabel(areaUnit)}`;

  function handleSearch() {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (area.trim()) params.set('area', area.trim());
    if (propertyTypeSlug) params.set('propertyTypeSlug', propertyTypeSlug);
    else if (categorySlug) params.set('propertyTypeCategory', categorySlug);
    if (minPrice !== '') params.set('minPrice', String(minPrice));
    if (maxPrice !== '') params.set('maxPrice', String(maxPrice));
    if (minArea !== '') params.set('minAreaValue', String(minArea));
    if (maxArea !== '') params.set('maxAreaValue', String(maxArea));
    if (minArea !== '' || maxArea !== '') params.set('areaUnit', areaUnit);

    if (variant === 'projects') {
      if (keyword.trim()) params.set('keyword', keyword.trim());
      if (developerSlug) params.set('developerSlug', developerSlug);
      router.push(`/developments?${params.toString()}`);
      return;
    }

    // ListingsBrowserSection (rendered on /listings) is the actual results
    // page — it reads exactly these params (city/area/propertyTypeSlug/
    // minPrice/maxPrice/minAreaValue/maxAreaValue/areaUnit/purpose). /buy-sell
    // and /rent were never real routes in apps/web/app, so submitting this
    // search bar 404'd; ListingSearchFilters' purpose is 'sale' | 'rent', not
    // this bar's own 'buy' | 'rent' toggle value, hence the mapping.
    params.set('purpose', purpose === 'rent' ? 'rent' : 'sale');
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <div className={`flex w-full flex-col items-center gap-4 ${className}`}>
      {variant === 'listings' && showPurposeToggle && (
        <div className="pointer-events-auto inline-flex items-center gap-1 self-center rounded-full border border-white/25 bg-white/10 p-1 backdrop-blur-md">
          {(['buy', 'rent'] as SearchBarPurpose[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPurpose(p)}
              className="relative rounded-full px-3 py-1.5 text-xs font-medium transition-transform duration-150 ease-out active:scale-90 sm:px-6 sm:py-2 sm:text-sm"
            >
              {purpose === p && (
                <motion.span
                  layoutId="propertySearchBarPurposePill"
                  className="absolute inset-0 rounded-full bg-white shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`relative z-10 whitespace-nowrap ${purpose === p ? 'text-brand-dark' : 'text-white'}`}>
                {p === 'buy' ? 'Buy' : 'Rent'}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full rounded-3xl bg-white p-3 shadow-2xl sm:rounded-[28px]">
        <div className="flex flex-col divide-y divide-slate-100 sm:flex-row sm:items-stretch sm:divide-y-0">
          <FilterField
            icon={MapPin}
            label="City"
            valueLabel={city}
            placeholder="All Cities"
            open={openField === 'city'}
            onToggle={() => toggleField('city')}
            panelClassName="w-64"
          >
            <input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search city…"
              autoFocus
              className="mb-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <div className="max-h-52 space-y-0.5 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  setCity('');
                  setOpenField(null);
                }}
                className={optionClass(city === '')}
              >
                All Cities
              </button>
              {filteredCities.length === 0 ? (
                <p className="px-2.5 py-1.5 text-xs text-slate-400">No cities found.</p>
              ) : (
                filteredCities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCity(c);
                      setOpenField(null);
                    }}
                    className={optionClass(city === c)}
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
          </FilterField>

          {/* Area is a live search box (Google Places autocomplete manages its
              own suggestion dropdown), not a click-to-open panel like the
              other fields — typing should work immediately without an extra
              click first. */}
          <div className="flex flex-[2] flex-col items-start gap-0.5 border-b border-slate-100 px-4 py-2.5 sm:border-b-0 sm:border-r-0 sm:px-5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Locate className="h-3.5 w-3.5 text-primary" />
              Area
            </span>
            <PlacesAutocompleteInput
              value={area}
              onChange={setArea}
              placeholder="e.g. Bahria Town, DHA"
              className="h-auto w-full border-none bg-transparent p-0 text-sm font-medium text-primary placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex flex-col items-center justify-center px-1 pt-2 sm:pl-2 sm:pt-0">
            <button
              type="button"
              onClick={handleSearch}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-heading-gradient px-7 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:translate-y-0 active:scale-95 sm:w-auto"
            >
              <SearchIcon className="h-4 w-4" />
              Search
            </button>
            <div className="flex justify-end px-2 pt-1">
              <button
                type="button"
                onClick={() => setSeeMore((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-primary transition-transform duration-150 ease-out active:scale-95"
              >
                {seeMore ? 'See Less' : 'See More'}
                {seeMore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {seeMore && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              // Absolutely positioned below the card (top-full), same as every
              // individual FilterField dropdown, instead of a flow-affecting
              // height animation — that way opening it never grows the card
              // itself, which matters because the Hero's desktop wrapper
              // anchors this card by its bottom edge (-bottom-28); a taller
              // card there grows upward, so real content growth here used to
              // read as the whole search bar jumping up instead of the panel
              // dropping down.
              className="absolute inset-x-0 top-full z-20 mt-2 rounded-2xl border border-slate-100 bg-white shadow-2xl"
            >
              <div className="flex flex-col divide-y divide-slate-100 sm:flex-row sm:items-stretch sm:divide-y-0">
                <FilterField
                  icon={Home}
                  label="Property Type"
                  valueLabel={selectedTypeLabel}
                  placeholder="All"
                  open={openField === 'type'}
                  onToggle={() => toggleField('type')}
                  panelClassName="w-80"
                >
                  <div className="mb-3 flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                    <div className="flex gap-3 overflow-x-auto">
                      {categories.map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() => {
                            setCategorySlug(c.slug);
                            setPropertyTypeSlug('');
                          }}
                          className={`shrink-0 whitespace-nowrap pb-1.5 text-sm font-medium transition-colors ${c.slug === activeCategoryTab ? 'border-b-2 border-primary text-primary' : 'text-slate-500'
                            }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPropertyTypeSlug('');
                      setOpenField(null);
                    }}
                    className={`${optionClass(propertyTypeSlug === '')} mb-2`}
                  >
                    All Types
                  </button>
                  <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                    {typesInActiveCategory.map((t) => (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() => {
                          setPropertyTypeSlug(t.slug);
                          setOpenField(null);
                        }}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors ${propertyTypeSlug === t.slug ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <Home className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </FilterField>

                <FilterField
                  icon={Wallet}
                  label="Budget Range"
                  valueLabel={budgetLabel}
                  placeholder="0 – Any"
                  open={openField === 'budget'}
                  onToggle={() => toggleField('budget')}
                  panelClassName="w-80"
                >
                  <RangeDropdown
                    minValue={minPrice}
                    maxValue={maxPrice}
                    options={PRICE_OPTIONS}
                    formatOption={priceOptionLabel}
                    onChangeMin={setMinPrice}
                    onChangeMax={setMaxPrice}
                  />
                </FilterField>

                <FilterField
                  icon={Ruler}
                  label="Area Range"
                  valueLabel={areaLabel}
                  placeholder="0 – Any"
                  open={openField === 'area'}
                  onToggle={() => toggleField('area')}
                  panelClassName="w-80"
                  last
                >
                  <RangeDropdown
                    minValue={minArea}
                    maxValue={maxArea}
                    options={areaOptions}
                    formatOption={(v) => String(v)}
                    onChangeMin={setMinArea}
                    onChangeMax={setMaxArea}
                    unit={{ value: areaUnit, onChange: setAreaUnit }}
                  />
                </FilterField>
              </div>

              {variant === 'projects' && (
                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 p-3 pt-4 sm:grid-cols-2">
                  <div className="relative">
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      Project Title
                    </label>
                    <input
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onFocus={() => setOpenField('project')}
                      placeholder="Select Projects"
                      className="w-full rounded-lg border-b border-slate-200 px-1 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
                    />
                    {openField === 'project' && keyword.trim().length >= 2 && (
                      <div className="absolute left-0 top-full z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-2xl">
                        {projectSuggestQuery.isLoading ? (
                          <p className="px-2 py-1.5 text-xs text-slate-400">Searching…</p>
                        ) : (projectSuggestQuery.data?.items.length ?? 0) === 0 ? (
                          <p className="px-2 py-1.5 text-xs text-slate-400">No projects found.</p>
                        ) : (
                          projectSuggestQuery.data!.items.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setOpenField(null);
                                router.push(`/developments/${p.slug}`);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="min-w-0 flex-1 truncate">{p.name}</span>
                              <span className="shrink-0 text-xs text-slate-400">{p.city}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <User2 className="h-3.5 w-3.5 text-primary" />
                      Developer Title
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        value={developerInput}
                        onChange={(e) => {
                          setDeveloperInput(e.target.value);
                          if (developerSlug) setDeveloperSlug('');
                        }}
                        onFocus={() => setOpenField('developer')}
                        placeholder="Select Developers"
                        className="w-full rounded-lg border-b border-slate-200 px-1 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
                      />
                      {developerSlug && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeveloperSlug('');
                            setDeveloperInput('');
                          }}
                          aria-label="Clear developer"
                          className="shrink-0 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {developerSlug && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </div>
                    {openField === 'developer' && developerInput.trim().length >= 1 && (
                      <div className="absolute left-0 top-full z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-2xl">
                        {developerMatches.length === 0 ? (
                          <p className="px-2 py-1.5 text-xs text-slate-400">No developers found.</p>
                        ) : (
                          developerMatches.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setDeveloperSlug(d.slug);
                                setDeveloperInput(d.name);
                                setOpenField(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <User2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="min-w-0 flex-1 truncate">{d.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
