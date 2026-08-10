'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAgenciesViewModel } from '@jayedaad/core';
import { AgencyCard } from './AgencyCard';

// Top placement tier — a horizontally-scrolling strip, same convention as
// the reference design. The floating arrow scrolls the strip; it links out
// to the full Titanium-only grid (AgenciesSearchResults, via ?tier=titanium)
// once there's more than a page's worth to browse. Renders nothing once the
// real API confirms there are no Titanium agencies yet — no sample-data
// substitution.
export function TitaniumAgenciesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { agencies, total, isLoading } = useAgenciesViewModel({ tier: 'titanium', pageSize: 12 });

  if (!isLoading && agencies.length === 0) return null;
  const items = agencies;

  function scrollByCard() {
    scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-heading-gradient">Titanium Agencies</h2>
        {total > agencies.length && (
          <Link href="/agents?tier=titanium" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        )}
      </div>

      <div className="relative">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[86px] w-[280px] shrink-0 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
              ))
            : items.map((agency) => (
                <div key={agency.id} className="shrink-0">
                  <AgencyCard agency={agency} />
                </div>
              ))}
        </div>

        {items.length > 3 && (
          <button
            type="button"
            onClick={scrollByCard}
            aria-label="Scroll for more agencies"
            className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition-colors hover:text-primary sm:flex"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
