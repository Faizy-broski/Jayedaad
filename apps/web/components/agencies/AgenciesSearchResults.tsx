'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAgenciesViewModel, type AgencyTier } from '@jayedaad/core';
import { AgencyCard } from './AgencyCard';
import { Pagination } from '@/components/listings/Pagination';
import { SAMPLE_AGENCIES } from '@/data/sampleAgencies';

const PAGE_SIZE = 12;

interface AgenciesSearchResultsProps {
  city?: string;
  location?: string;
  propertyTypeSlug?: string;
  search?: string;
  tier?: AgencyTier;
}

const TIER_LABEL: Record<AgencyTier, string> = {
  titanium: 'Titanium Agencies',
  featured: 'Featured Agencies',
  basic: 'Agencies',
};

// The searchable/paginated directory — replaces the curated Titanium/
// Featured/By-City sections whenever the hero search bar (or a "View
// Agencies"/tier link) sends the visitor here with an active filter.
export function AgenciesSearchResults({ city, location, propertyTypeSlug, search, tier }: AgenciesSearchResultsProps) {
  const [page, setPage] = useState(1);

  const { agencies, total, isLoading } = useAgenciesViewModel({
    city: city || undefined,
    location: location || undefined,
    propertyTypeSlug: propertyTypeSlug || undefined,
    search: search || undefined,
    tier,
    page,
    pageSize: PAGE_SIZE,
  });

  // No sample fallback for a propertyTypeSlug filter — SAMPLE_AGENCIES has no
  // per-type inventory to honestly match against (see data/sampleAgencies.ts).
  const usingSample = !isLoading && agencies.length === 0 && !propertyTypeSlug;
  const sampleMatches = usingSample
    ? SAMPLE_AGENCIES.filter((a) => {
        if (tier && a.tier !== tier) return false;
        if (city && a.city !== city) return false;
        if (location && !a.address?.toLowerCase().includes(location.toLowerCase())) return false;
        if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
    : [];

  const items = usingSample ? sampleMatches : agencies;
  const displayTotal = usingSample ? sampleMatches.length : total;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading-gradient">
            {displayTotal} {tier ? TIER_LABEL[tier] : 'Agencies'}
          </h1>
          {(city || location || propertyTypeSlug || search) && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              {[city, location, search].filter(Boolean).join(' · ') || 'Filtered results'}
              <Link href="/agents" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
                <X className="h-3 w-3" />
                Clear
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[86px] animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
            No agencies match your filters. Try widening your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        )}
        {!usingSample && !isLoading && total > 0 && <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />}
      </div>
    </div>
  );
}
