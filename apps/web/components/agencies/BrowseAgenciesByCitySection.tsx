'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { useAgencyCitiesViewModel } from '@jayedaad/core';

const VISIBLE_COUNT = 4;

// Backed by GET /agencies/cities (AgenciesRepository.listCitiesWithCounts) —
// real per-city agency counts. Renders nothing once the real API confirms
// there are no cities yet — no sample-data substitution.
export function BrowseAgenciesByCitySection() {
  const { cities, isLoading } = useAgencyCitiesViewModel();
  const [expanded, setExpanded] = useState(false);

  if (!isLoading && cities.length === 0) return null;
  const visible = expanded ? cities : cities.slice(0, VISIBLE_COUNT);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 pb-16">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-heading-gradient">Browse Agencies By City</h2>
      </div>

      <div className="relative">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {isLoading
            ? Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
              ))
            : visible.map(({ city, count }) => (
                <div
                  key={city}
                  className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <MapPin className="absolute -right-2 -top-2 h-16 w-16 text-slate-200" />
                  <p className="relative text-sm font-semibold text-slate-900">{city}</p>
                  <p className="relative mt-0.5 text-xs text-slate-500">{count} Agencies</p>
                  <Link
                    href={`/agents?city=${encodeURIComponent(city)}`}
                    className="relative mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View Agencies
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
        </div>

        {!expanded && cities.length > VISIBLE_COUNT && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Browse all cities"
            className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition-colors hover:text-primary sm:flex"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
