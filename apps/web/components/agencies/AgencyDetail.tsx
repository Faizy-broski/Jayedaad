'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Building2, ChevronRight, MapPin, PhoneCall, Share2, Users } from 'lucide-react';
import type { AgencyDetail as AgencyDetailModel, AgencyStats, AgencyTier } from '@jayedaad/core';
import { AgencyStaffCard } from './AgencyStaffCard';
import { AgencyContactForm } from './AgencyContactForm';

const TIER_LABEL: Record<AgencyTier, string> = {
  titanium: 'TITANIUM',
  featured: 'FEATURED',
  basic: 'AGENCY',
};

interface AgencyDetailProps {
  agency: AgencyDetailModel;
  stats?: AgencyStats;
  isStatsLoading: boolean;
}

async function handleShare(name: string) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: name, url });
    } catch {
      // Cancelled — no toast, matches a native share sheet dismissal.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard.');
  } catch {
    toast.error('Could not copy the link.');
  }
}

function StatTile({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex min-w-[84px] flex-1 flex-col items-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="text-lg font-bold text-slate-900">{value}</span>
      <span className="mt-0.5 text-[11px] text-slate-500">{label}</span>
    </Link>
  );
}

// Every "Properties By [Agency]" link — the section-level "View All" and the
// per-type stat tiles alike — scopes GET /listings to just this agency via
// ?agencySlug=. agencyName rides along purely so ListingsBrowserSection can
// display "Showing listings from X" without an extra lookup (see its
// comment); it plays no role in the actual filter.
function agencyListingsHref(agency: AgencyDetailModel, purpose: 'sale' | 'rent', propertyTypeSlug?: string): string {
  const params = new URLSearchParams({ agencySlug: agency.slug, agencyName: agency.name, purpose });
  if (propertyTypeSlug) params.set('propertyTypeSlug', propertyTypeSlug);
  return `/listings?${params.toString()}`;
}

export function AgencyDetail({ agency, stats, isStatsLoading }: AgencyDetailProps) {
  const forSaleTypes = (stats?.byPropertyType ?? []).filter((t) => t.forSale > 0);
  const forRentTypes = (stats?.byPropertyType ?? []).filter((t) => t.forRent > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:pb-16 sm:pt-28 lg:pt-32">
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        aria-label="Breadcrumb"
        className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500"
      >
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/agents" className="hover:text-primary">
          Agents
        </Link>
        {agency.city && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/agents?city=${encodeURIComponent(agency.city)}`} className="hover:text-primary">
              {agency.city}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700">{agency.name}</span>
      </motion.nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-10">
          {/* Header card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                {agency.logoUrl ? (
                  <Image src={agency.logoUrl} alt={agency.name} width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-7 w-7" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{agency.name}</h1>
                  {agency.tier !== 'basic' && (
                    <span className="rounded-full bg-heading-gradient px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary-foreground">
                      {TIER_LABEL[agency.tier]}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {agency.city ? `${agency.city}, Pakistan` : 'Pakistan'}
                </p>
                {!isStatsLoading && stats && (
                  <p className="mt-1.5 flex items-center gap-3 text-xs font-medium text-slate-600">
                    <Link href={agencyListingsHref(agency, 'sale')} className="flex items-center gap-1 hover:text-primary">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      {stats.forSaleCount} for Sale
                    </Link>
                    <Link href={agencyListingsHref(agency, 'rent')} className="flex items-center gap-1 hover:text-primary">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {stats.forRentCount} for Rent
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleShare(agency.name)}
              className="flex shrink-0 items-center gap-1.5 self-start rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 sm:self-center"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>

          {/* Properties by agency */}
          <div>
            <h2 className="text-lg font-bold text-heading-gradient">Properties By {agency.name}</h2>

            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Building2 className="h-4 w-4 text-primary" />
                    {stats?.forSaleCount ?? 0} Properties for Sale
                  </p>
                  <Link href={agencyListingsHref(agency, 'sale')} className="text-xs font-medium text-primary hover:underline">
                    View All
                  </Link>
                </div>
                {forSaleTypes.length === 0 ? (
                  <p className="text-xs text-slate-400">No properties for sale yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {forSaleTypes.map((t) => (
                      <StatTile
                        key={t.propertyTypeSlug}
                        label={t.label}
                        value={t.forSale}
                        href={agencyListingsHref(agency, 'sale', t.propertyTypeSlug)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Building2 className="h-4 w-4 text-primary" />
                    {stats?.forRentCount ?? 0} Properties for Rent
                  </p>
                  <Link href={agencyListingsHref(agency, 'rent')} className="text-xs font-medium text-primary hover:underline">
                    View All
                  </Link>
                </div>
                {forRentTypes.length === 0 ? (
                  <p className="text-xs text-slate-400">No properties for rent yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {forRentTypes.map((t) => (
                      <StatTile
                        key={t.propertyTypeSlug}
                        label={t.label}
                        value={t.forRent}
                        href={agencyListingsHref(agency, 'rent', t.propertyTypeSlug)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Agency staff */}
          {agency.staff.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-heading-gradient">Agency Staff</h2>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {agency.staff.map((member) => (
                  <AgencyStaffCard key={member.id} staff={member} />
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {agency.description && (
            <div>
              <h2 className="text-lg font-bold text-heading-gradient">About {agency.name}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{agency.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          {agency.phone && (
            <a
              href={`tel:${agency.phone}`}
              className="flex items-center justify-center gap-2 rounded-full bg-heading-gradient px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <PhoneCall className="h-4 w-4" />
              Call Now
            </a>
          )}
          <AgencyContactForm agencyId={agency.id} agencyName={agency.name} />
        </div>
      </div>
    </div>
  );
}
