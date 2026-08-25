'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { AreaUnit } from '@jayedaad/core';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Globe2,
  Home,
  LandPlot,
  Landmark,
  MapPin,
  Search as SearchIcon,
  Store,
} from 'lucide-react';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';
import { RangeDropdown } from '@/components/shared/PropertySearchBar';
import { PRICE_OPTIONS, priceOptionLabel } from '@/lib/priceOptions';
import { AREA_UNIT_OPTIONS, areaUnitLabel } from '@/lib/areaOptions';

type Purpose = 'buy' | 'rent';

// Quick-pick cities shown as their own buttons before the "All Cities"
// catch-all, same three biggest metros the mockup calls out by name. Rest of
// PAKISTAN_CITIES stays reachable — picking "All Cities" just skips the
// `city` filter entirely rather than opening another picker, keeping this
// card a single flat step instead of nesting a dropdown inside it.
const QUICK_CITIES: { name: string; icon: typeof Landmark }[] = [
  { name: 'Lahore', icon: Landmark },
  { name: 'Karachi', icon: Building2 },
  { name: 'Islamabad', icon: Landmark },
];

// Mirrors the seeded taxonomy (supabase/migrations/0005_taxonomy_seed.sql):
// House/Apartment map to real property-type slugs, Plot/Commercial map to
// their whole category since the mockup's 4 buttons are broader than any
// single commercial property type. Matches PropertySearchBar.handleSearch's
// propertyTypeSlug-first, propertyTypeCategory-fallback param scheme.
const PROPERTY_TYPES: {
  label: string;
  icon: typeof Home;
  propertyTypeSlug?: string;
  propertyTypeCategory?: string;
}[] = [
  { label: 'House', icon: Home, propertyTypeSlug: 'house' },
  { label: 'Apartment', icon: Building2, propertyTypeSlug: 'flat' },
  { label: 'Plot', icon: LandPlot, propertyTypeCategory: 'plot' },
  { label: 'Commercial', icon: Store, propertyTypeCategory: 'commercial' },
];

function StepLabel({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-semibold text-slate-800">
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
  const [propertyType, setPropertyType] = useState<(typeof PROPERTY_TYPES)[number] | null>(null);
  const [area, setArea] = useState('');
  const [moreFilters, setMoreFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minArea, setMinArea] = useState<number | ''>('');
  const [maxArea, setMaxArea] = useState<number | ''>('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('marla');

  function handleSearch() {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (area.trim()) params.set('area', area.trim());
    if (propertyType?.propertyTypeSlug) params.set('propertyTypeSlug', propertyType.propertyTypeSlug);
    else if (propertyType?.propertyTypeCategory) params.set('propertyTypeCategory', propertyType.propertyTypeCategory);
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
      <div className="pointer-events-auto inline-flex items-center gap-1 self-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
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
            <span className={`relative z-10 ${purpose === p ? 'text-primary-foreground' : 'text-slate-600'}`}>
              {p === 'buy' ? 'Buy' : 'Rent'}
            </span>
          </button>
        ))}
      </div>

      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
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
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCity('')}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                city === ''
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Globe2 className="h-5 w-5" />
              All Cities
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.3fr_1fr] sm:gap-6">
          <div>
            <StepLabel step={2}>Property Type</StepLabel>
            <div className="grid grid-cols-4 gap-2.5">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.label}
                  type="button"
                  onClick={() => setPropertyType((cur) => (cur?.label === type.label ? null : type))}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                    propertyType?.label === type.label
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <type.icon className="h-5 w-5" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <StepLabel step={3}>Area / Society</StepLabel>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <PlacesAutocompleteInput
                  value={area}
                  onChange={setArea}
                  placeholder="e.g. DHA, Bahria Town, Gulberg…"
                  className="h-auto w-full border-none bg-transparent p-0 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
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
              <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <span className="mb-2 block text-xs font-semibold text-slate-800">Budget Range</span>
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
                  <span className="mb-2 block text-xs font-semibold text-slate-800">Area Range</span>
                  <RangeDropdown
                    minValue={minArea}
                    maxValue={maxArea}
                    options={AREA_UNIT_OPTIONS[areaUnit]}
                    formatOption={(v) => String(v)}
                    onChangeMin={setMinArea}
                    onChangeMax={setMaxArea}
                    unit={{ value: areaUnit, onChange: setAreaUnit }}
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">Unit: {areaUnitLabel(areaUnit)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
