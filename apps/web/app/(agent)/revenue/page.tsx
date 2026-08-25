'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  DealType,
  useAgentProfileViewModel,
  useAuthViewModel,
  useDealsViewModel,
  useRevenueViewModel,
  useFormattedPrice,
} from '@jayedaad/core';
import { KpiCard, Pagination, Table, TableColumn } from '@jayedaad/ui-web';
import { AlertTriangle, Banknote, Handshake, ImageOff, TrendingUp, Wallet } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

type RevenuePeriod = 'month' | 'quarter' | 'year';

const PERIOD_FILTERS: { id: RevenuePeriod; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

const DEAL_TYPE_BADGE: Record<DealType, { label: string; className: string }> = {
  sale: { label: 'Sale', className: 'bg-primary/10 text-primary' },
  rent: { label: 'Rent', className: 'bg-brand-emerald/10 text-brand-emerald' },
};

// Themed tooltip — same shape as dashboard/page.tsx's ChartTooltip; no
// shared export exists yet for either to import from, so this is another
// local copy (matches the [id]/performance/page.tsx precedent).
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

const DEALS_PAGE_SIZE = 20;

// Deals & Revenue — commission revenue bucketed by month/quarter/year (Part
// 4 of the plan), plus a per-agent breakdown for agency admins toggled into
// "Whole Agency" scope. Same KPI-cards + chart + table shape as
// [id]/performance/page.tsx, one level up (agent-wide instead of
// listing-scoped).
export default function RevenuePage() {
  const { agentId } = useAuthViewModel();
  const { profile } = useAgentProfileViewModel();
  const { format: formatPrice } = useFormattedPrice();

  const [period, setPeriod] = useState<RevenuePeriod>('month');
  // Same pattern as property-management/page.tsx's "Show Whole Agency"
  // toggle — agency-admin-only, ignored server-side for a non-admin agent.
  const [agencyScope, setAgencyScope] = useState(false);
  const [dealsPage, setDealsPage] = useState(1);
  const scope: 'own' | 'agency' = agencyScope ? 'agency' : 'own';

  const { revenue, isRevenueLoading, isRevenueError } = useRevenueViewModel(agentId, { period, scope });
  const { deals, total: dealsTotal, isLoading: isDealsLoading, isError: isDealsError } = useDealsViewModel({
    scope,
    page: dealsPage,
    pageSize: DEALS_PAGE_SIZE,
  });

  const totalRevenue = revenue?.totalRevenue ?? 0;
  const dealCount = revenue?.dealCount ?? 0;
  const avgDealValue = dealCount > 0 ? totalRevenue / dealCount : 0;

  const kpiTiles = [
    { icon: Wallet, label: 'Total Revenue', value: formatPrice(totalRevenue), sub: `This ${period}` },
    { icon: Handshake, label: 'Deals Closed', value: dealCount, sub: `This ${period}` },
    { icon: Banknote, label: 'Avg. Deal Value', value: formatPrice(avgDealValue), sub: 'Commission per deal' },
  ];

  const trendData = (revenue?.byPeriod ?? []).map((point) => ({
    label: point.period,
    revenue: point.revenue,
    dealCount: point.dealCount,
  }));

  const dealsTotalPages = Math.max(1, Math.ceil(dealsTotal / DEALS_PAGE_SIZE));

  const dealColumns: TableColumn<(typeof deals)[number]>[] = [
    {
      key: 'listing',
      header: 'Listing',
      render: (deal) =>
        deal.listingId ? (
          <Link href={`/property-management/${deal.listingId}/performance`} className="text-sm font-medium text-primary hover:underline">
            {deal.listingTitle ?? 'View listing'}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (deal) => {
        const badge = DEAL_TYPE_BADGE[deal.dealType];
        return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}>{badge.label}</span>;
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (deal) => <span className="text-sm text-foreground">{formatPrice(Number(deal.amount))}</span>,
    },
    {
      key: 'commissionRate',
      header: 'Commission %',
      render: (deal) => <span className="text-sm text-foreground">{deal.commissionRate != null ? `${deal.commissionRate}%` : '—'}</span>,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (deal) => <span className="text-sm font-semibold text-foreground">{formatPrice(Number(deal.commissionAmount))}</span>,
    },
    {
      key: 'closedAt',
      header: 'Closed Date',
      render: (deal) => (
        <span className="text-sm text-muted-foreground">
          {new Date(deal.closedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    ...(agencyScope
      ? [
          {
            key: 'agent',
            header: 'Agent',
            render: (deal) => <span className="text-sm text-foreground">{deal.agentName ?? '—'}</span>,
          } satisfies TableColumn<(typeof deals)[number]>,
        ]
      : []),
  ];

  const sortedByAgent = [...(revenue?.byAgent ?? [])].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Deals &amp; Revenue</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track closed deals and commission revenue over time.</p>
            <Link href="/pipeline/analytics" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View open pipeline & forecast <TrendingUp className="h-3 w-3" />
            </Link>
          </div>
          {profile?.isAgencyAdmin && (
            <button
              type="button"
              onClick={() => {
                setAgencyScope((v) => !v);
                setDealsPage(1);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                agencyScope ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-muted-foreground hover:text-foreground'
              }`}
            >
              {agencyScope ? 'Showing: Whole Agency' : 'Show Whole Agency'}
            </button>
          )}
        </div>
      </Reveal>

      {/* Period toggle */}
      <div className="flex flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1 sm:w-fit">
        {PERIOD_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setPeriod(f.id)}
            className={`relative flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              period === f.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {period === f.id && (
              <motion.span
                layoutId="activeRevenuePeriodPill"
                className="bg-heading-gradient absolute inset-0 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">{f.label}</span>
          </button>
        ))}
      </div>

      {isRevenueError ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-destructive/60" />
          <p className="text-sm text-destructive">Couldn&apos;t load revenue — please try again.</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {isRevenueLoading
              ? [0, 1, 2].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-[24px] border border-border bg-muted/40" />)
              : kpiTiles.map((tile, index) => <KpiCard key={tile.label} index={index} {...tile} />)}
          </div>

          {/* Trend chart */}
          <Reveal>
            <div className="rounded-[24px] border border-border bg-background p-4 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-foreground">Revenue trend</h2>
              <p className="text-sm text-muted-foreground">Commission revenue by {period}</p>
              {isRevenueLoading ? (
                <div className="mt-4 h-60 animate-pulse rounded-md bg-muted/40" />
              ) : trendData.length === 0 ? (
                <div className="mt-4 flex h-60 flex-col items-center justify-center text-center">
                  <ImageOff className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No deals closed yet.</p>
                </div>
              ) : (
                <div className="mt-4 h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                      <Bar dataKey="revenue" name="Revenue" fill="url(#revenueFill)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Reveal>

          {/* Agency-wide breakdown — who closed what, admin + agency-scope only */}
          {profile?.isAgencyAdmin && agencyScope && (
            <Reveal>
              <div className="rounded-[24px] border border-border bg-background p-4 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Revenue by agent
                </h2>
                <p className="text-sm text-muted-foreground">Who closed which deals this {period}</p>
                {isRevenueLoading ? (
                  <div className="mt-4 space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-10 animate-pulse rounded-md bg-muted/40" />
                    ))}
                  </div>
                ) : sortedByAgent.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No deals closed by any associate yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-border">
                    {sortedByAgent.map((a) => (
                      <li key={a.agentId} className="flex items-center justify-between gap-3 py-3">
                        <p className="truncate text-sm font-medium text-foreground">{a.displayName ?? 'Unnamed'}</p>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {a.dealCount} deal{a.dealCount === 1 ? '' : 's'} ·{' '}
                          <span className="font-semibold text-foreground">{formatPrice(a.revenue)}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          )}
        </>
      )}

      {/* Deals ledger */}
      <Reveal>
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Closed deals</h2>
            <p className="text-sm text-muted-foreground">Every deal marked sold or rented{agencyScope ? ' across your agency' : ''}.</p>
          </div>
          {isDealsError ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
              <AlertTriangle className="mb-3 h-10 w-10 text-destructive/60" />
              <p className="text-sm text-destructive">Couldn&apos;t load deals — please try again.</p>
            </div>
          ) : (
            <>
              <Table columns={dealColumns} rows={deals} rowKey={(deal) => deal.id} isLoading={isDealsLoading} emptyMessage="No deals closed yet." />
              <Pagination page={dealsPage} totalPages={dealsTotalPages} onPageChange={setDealsPage} />
            </>
          )}
        </div>
      </Reveal>
    </div>
  );
}
