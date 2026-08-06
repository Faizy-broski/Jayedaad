'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Wallet, BedDouble, Home, Search as SearchIcon } from 'lucide-react';

export type SearchPurpose = 'buy' | 'rent' | 'commercial';

const PURPOSE_TABS: { label: string; value: SearchPurpose }[] = [
  { label: 'Buy', value: 'buy' },
  { label: 'Rent', value: 'rent' },
  // { label: 'Commercial', value: 'commercial' },
];

const BUDGET_OPTIONS = ['Any', 'Under 50 Lac', '50 Lac - 1 Cr', '1 Cr - 3 Cr', '3 Cr+'];
const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4', '5+'];
const TYPE_OPTIONS = ['Any', 'House', 'Apartment', 'Villa', 'Plot', 'Commercial'];

interface SearchBarProps {
  defaultPurpose?: SearchPurpose;
  className?: string;
}

/** Purpose pill + property-search fields, shared by the homepage Hero and any
    other hero that needs the same "Buy / Rent / Commercial" search card. */
export function SearchBar({ defaultPurpose = 'buy', className = '' }: SearchBarProps) {
  const [purpose, setPurpose] = useState<SearchPurpose>(defaultPurpose);

  return (
    <div className={`flex w-full flex-col items-center gap-4 ${className}`}>
      <div className="pointer-events-auto inline-flex items-center gap-1 self-center rounded-full border border-white/25 bg-white/10 p-1 backdrop-blur-md">
        {PURPOSE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setPurpose(tab.value)}
            className="relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-6 sm:py-2 sm:text-sm"
          >
            {purpose === tab.value && (
              <motion.span
                layoutId="purpose-pill"
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className={`relative z-10 whitespace-nowrap ${purpose === tab.value ? 'text-brand-dark' : 'text-white'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <form
        action="/search"
        method="get"
        className="flex w-full flex-col gap-3 rounded-3xl bg-white p-3 shadow-2xl sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-2"
      >
        <input type="hidden" name="purpose" value={purpose} />

        <div className="flex flex-1 flex-col divide-y divide-slate-100 sm:flex-row sm:items-center sm:divide-y-0 sm:divide-x sm:divide-slate-200 sm:gap-0">
          <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2 text-left sm:rounded-none sm:px-5">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Where</span>
              <input
                name="location"
                placeholder="Lahore, DHA..."
                className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </span>
          </label>

          <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2 text-left sm:rounded-none sm:px-5">
            <Wallet className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Budget</span>
              <select
                name="budget"
                defaultValue={BUDGET_OPTIONS[0]}
                className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
              >
                {BUDGET_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </span>
          </label>

          <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2 text-left sm:rounded-none sm:px-5">
            <BedDouble className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Bedrooms</span>
              <select
                name="bedrooms"
                defaultValue={BEDROOM_OPTIONS[0]}
                className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
              >
                {BEDROOM_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </span>
          </label>

          <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2 text-left sm:rounded-none sm:px-5">
            <Home className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Type</span>
              <select
                name="type"
                defaultValue={TYPE_OPTIONS[0]}
                className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </span>
          </label>
        </div>

        <div className="flex items-center justify-center px-1 sm:pl-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-heading-gradient px-7 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            <SearchIcon className="h-4 w-4" />
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
