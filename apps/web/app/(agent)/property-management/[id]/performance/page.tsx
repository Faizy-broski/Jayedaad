'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Lead,
  ListingStatus,
  useLeadInboxViewModel,
  useListingAnalyticsViewModel,
  useListingDetailViewModel,
  useFormattedPrice,
} from '@jayedaad/core';
import { Button, KpiCard } from '@jayedaad/ui-web';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Handshake,
  ImageOff,
  Inbox,
  Mail,
  MapPin,
  MessageCircle,
  MousePointerClick,
  Phone,
  Smartphone,
  Users,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { MarkDealModal } from '@/components/listings/MarkDealModal';

// Same badge set property-management/page.tsx's STATUS_BADGE uses — kept
// as a local copy rather than importing from that file, which a parallel
// change is actively editing (see plan §3b).
const STATUS_BADGE: Record<ListingStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  verified: { label: 'Active', className: 'bg-primary/10 text-primary' },
  pending_verification: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
  expired: { label: 'Expired', className: 'bg-slate-100 text-slate-600' },
  deleted: { label: 'Deleted', className: 'bg-slate-100 text-slate-600' },
  downgraded: { label: 'Downgraded', className: 'bg-slate-100 text-slate-600' },
  inactive: { label: 'Inactive', className: 'bg-slate-100 text-slate-600' },
  sold: { label: 'Sold', className: 'bg-emerald-100 text-emerald-700' },
  rented: { label: 'Rented', className: 'bg-emerald-100 text-emerald-700' },
};

const SOURCE_ICON: Record<string, typeof MessageCircle> = {
  chatbot: MessageCircle,
  contact_form: Mail,
  call_request: Phone,
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Themed tooltip — same shape as dashboard/page.tsx's ChartTooltip (and
// admin/dashboard's copy of it); no shared export exists yet for either to
// import from, so this is a third local copy rather than a risky cross-app
// extraction.
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-muted-foreground">
          {p.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />}
          {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// Trimmed lead card — a subset of crm/page.tsx's full card (no status
// dropdown/notes thread/reminder popover; this page is "who inquired about
// this listing", not lead management, which stays on /crm). Duplicated
// rather than extracted since crm/page.tsx's version is tightly coupled to
// its own local state (openNoteFor/draftNotes/updateStatus mutation).
function LeadCard({ lead }: { lead: Lead }) {
  const SourceIcon = SOURCE_ICON[lead.source] ?? Mail;
  return (
    <li className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {lead.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{lead.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>{relativeTime(lead.createdAt)}</span>
              <span className="flex items-center gap-1 capitalize">
                <SourceIcon className="h-3 w-3" />
                {lead.source.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">{lead.status}</span>
      </div>
      {lead.message && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{lead.message}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground">
          <Phone className="h-3.5 w-3.5" />
          {lead.phone}
        </a>
        <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground">
          <Mail className="h-3.5 w-3.5" />
          {lead.email}
        </a>
      </div>
    </li>
  );
}

// Per-listing performance breakdown — the drill-down from My Listings'
// table (Part 3a's Performance action) into one listing's own KPI cards,
// daily trend, and who has actually inquired about it. Auth is already
// enforced by (agent)/layout.tsx's RequireEmailVerified wrapper plus the
// analytics/lead endpoints' own server-side agent/agency-admin/super_admin
// scoping — no extra client-side role gating needed here.
export default function ListingPerformancePage() {
  const params = useParams<{ id: string }>();
  const listingId = params?.id;
  const [dealModalOpen, setDealModalOpen] = useState(false);

  const { listing, isLoading: isListingLoading } = useListingDetailViewModel(listingId);
  const { analytics, isAnalyticsLoading, dailyAnalytics, isDailyAnalyticsLoading } = useListingAnalyticsViewModel(listingId);
  const { leads, isLoading: isLeadsLoading, isError: isLeadsError } = useLeadInboxViewModel({ listingId });
  const { format: formatPrice } = useFormattedPrice();

  const cover = listing?.media.find((m) => m.isCover) ?? listing?.media[0];
  const badge = listing ? STATUS_BADGE[listing.status] : undefined;

  const kpiTiles = [
    { icon: Eye, label: 'Views', value: analytics?.views ?? 0 },
    { icon: MousePointerClick, label: 'Clicks', value: analytics?.clicks ?? 0 },
    { icon: Users, label: 'Leads', value: analytics?.leads ?? 0 },
    { icon: Phone, label: 'Calls', value: analytics?.calls ?? 0 },
    { icon: MessageCircle, label: 'WhatsApp', value: analytics?.whatsapp ?? 0 },
    { icon: Smartphone, label: 'SMS', value: analytics?.sms ?? 0 },
    { icon: Mail, label: 'Emails', value: analytics?.emails ?? 0 },
  ];

  const trendData = dailyAnalytics.map((point) => ({
    label: new Date(point.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    views: point.views,
    leads: point.leads,
  }));

  return (
    <div className="space-y-6">
      <Reveal>
        <Link href="/property-management" prefetch={false} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Listings
        </Link>
      </Reveal>

      {isListingLoading ? (
        <div className="h-24 animate-pulse rounded-[24px] border border-border bg-muted/40" />
      ) : !listing ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
          <ImageOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">Listing not found</h3>
        </div>
      ) : (
        <Reveal>
          <div className="flex flex-wrap items-center gap-4 rounded-[24px] border border-border bg-background p-4 shadow-sm sm:p-6">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover.compressedUrl ?? cover.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Building2 className="h-6 w-6" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold text-foreground">{listing.title}</h1>
                {badge && <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.area}, {listing.city}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Listed {new Date(listing.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <p className="shrink-0 text-lg font-semibold text-foreground">{formatPrice(Number(listing.price))}</p>
            {listing.status === 'verified' && (
              <Button onClick={() => setDealModalOpen(true)} className="shrink-0">
                {listing.purpose === 'sale' ? (
                  <>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Mark Sold
                  </>
                ) : (
                  <>
                    <Handshake className="mr-1.5 h-4 w-4" />
                    Mark Rented
                  </>
                )}
              </Button>
            )}
          </div>
        </Reveal>
      )}

      {listing && (
        <MarkDealModal
          open={dealModalOpen}
          onClose={() => setDealModalOpen(false)}
          listingId={listing.id}
          purpose={listing.purpose}
        />
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {isAnalyticsLoading
          ? [0, 1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-[24px] border border-border bg-muted/40" />)
          : kpiTiles.map((tile, index) => <KpiCard key={tile.label} index={index} {...tile} />)}
      </div>

      {/* Trend chart */}
      <Reveal>
        <div className="rounded-[24px] border border-border bg-background p-4 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Views &amp; Leads trend</h2>
          <p className="text-sm text-muted-foreground">Day-by-day activity on this listing</p>
          {isDailyAnalyticsLoading ? (
            <div className="mt-4 h-60 animate-pulse rounded-md bg-muted/40" />
          ) : trendData.length === 0 ? (
            <div className="mt-4 flex h-60 flex-col items-center justify-center text-center">
              <ImageOff className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No activity yet.</p>
            </div>
          ) : (
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--brand-emerald))" />
                      <stop offset="100%" stopColor="hsl(var(--brand-emerald))" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="views" name="Views" fill="url(#viewsFill)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="leads" name="Leads" fill="url(#leadsFill)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Reveal>

      {/* Listing-scoped lead list */}
      <Reveal>
        <div className="rounded-[24px] border border-border bg-background p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-foreground">Inquiries for this listing</h2>
              <p className="text-sm text-muted-foreground">Everyone who has reached out about this listing</p>
            </div>
            {listingId && (
              <Link
                href={`/crm?listingId=${listingId}`}
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all leads <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {isLeadsLoading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
              ))}
            </div>
          ) : isLeadsError ? (
            <p className="mt-4 text-sm text-destructive">Couldn&apos;t load inquiries for this listing — please try again.</p>
          ) : leads.length === 0 ? (
            <div className="mt-6 flex flex-col items-center py-6 text-center">
              <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No inquiries yet for this listing.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
