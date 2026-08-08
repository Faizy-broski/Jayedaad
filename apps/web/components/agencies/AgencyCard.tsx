import Link from 'next/link';
import { Building2, MapPin } from 'lucide-react';
import type { AgencyWithStats } from '@jayedaad/core';

// Matches the reference design's agency row: logo, name, "X for Sale | Y for
// Rent" (computed server-side, see AgenciesRepository.getStatsForAgencies),
// and city. Links to the agency's public detail page (/agents/[slug]).
export function AgencyCard({ agency }: { agency: AgencyWithStats }) {
  return (
    <Link
      href={`/agents/${agency.slug}`}
      className="flex w-full min-w-[260px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
        {agency.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agency.logoUrl} alt={agency.name} className="h-full w-full object-cover" />
        ) : (
          <Building2 className="h-6 w-6" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{agency.name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {agency.forSaleCount} for Sale | {agency.forRentCount} for Rent
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-primary">
          <MapPin className="h-3 w-3 shrink-0" />
          {agency.city ?? 'Pakistan'}
        </p>
      </div>
    </Link>
  );
}
