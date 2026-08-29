'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAgenciesViewModel } from '@jayedaad/core';
import { AgencyCard } from './AgencyCard';

// Second placement tier — a fixed 2x4 grid (8 agencies), same convention as
// the reference design. The arrow links out to the full Featured-only grid
// once there's more than a page's worth to browse. Renders nothing once the
// real API confirms there are no Featured agencies yet — no sample-data
// substitution.
export function FeaturedAgenciesSection() {
  const { agencies, total, isLoading } = useAgenciesViewModel({ tier: 'featured', pageSize: 8 });

  if (!isLoading && agencies.length === 0) return null;
  const items = agencies;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-heading-gradient">Featured Agencies</h2>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[86px] animate-pulse rounded-xl border border-border bg-muted" />
              ))
            : items.map((agency) => <AgencyCard key={agency.id} agency={agency} />)}
        </div>

        {total > agencies.length && (
          <Link
            href="/agents?tier=featured"
            aria-label="View all featured agencies"
            className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg transition-colors hover:text-primary sm:flex"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}
