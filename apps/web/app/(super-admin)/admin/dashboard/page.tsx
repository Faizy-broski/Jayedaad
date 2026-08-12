'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AgentOverview, useAdminDashboardViewModel, useAuthViewModel } from '@jayedaad/core';
import { Badge, cn, KpiCard, Table, TableColumn } from '@jayedaad/ui-web';
import {
  ArrowRight,
  Building2,
  CreditCard,
  Home,
  Inbox,
  LayoutGrid,
  PieChart as PieChartIcon,
  ShieldCheck,
  Sun,
  UserCircle2,
  Users,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

type BreakdownKey = 'agencies' | 'listings' | 'leads' | 'subscriptions';

const BREAKDOWN_TABS: { id: BreakdownKey; label: string; href: string }[] = [
  { id: 'agencies', label: 'Agencies', href: '/admin/agencies' },
  { id: 'listings', label: 'Listings', href: '/admin/listings' },
  { id: 'leads', label: 'Leads', href: '/admin/crm' },
  { id: 'subscriptions', label: 'Plans', href: '/admin/plans' },
];

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--brand-emerald))',
  '#f59e0b',
  '#8b5cf6',
  '#64748b',
  '#0ea5e9',
];

// Themed tooltip — recharts renders its own unstyled default, this matches
// the rest of the app's card/shadow language instead. Same pattern as the
// agent dashboard's ChartTooltip (apps/web/app/(agent)/dashboard/page.tsx).
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium capitalize text-foreground">{label.replace(/_/g, ' ')}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-muted-foreground">
          {p.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />}
          <span className="capitalize">{p.name.replace(/_/g, ' ')}</span>: <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function toChartData(record: Record<string, number> | undefined) {
  return Object.entries(record ?? {}).map(([name, value], index) => ({
    name,
    value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function sum(record: Record<string, number> | undefined) {
  return Object.values(record ?? {}).reduce((a, b) => a + b, 0);
}

// Super Admin landing page — platform-wide KPI rollup (GET /admin/stats)
// plus the agents overview roster (GET /admin/agents), both computed at
// query time server-side. Restyled to match the agent dashboard's visual
// language (greeting header, stat tiles, chart cards) — every number here
// is still real, a fresh platform shows all zeros rather than any
// placeholder/sample data, same principle as the agent dashboard.
export default function AdminDashboardPage() {
  const { stats, isStatsLoading, isStatsError, agents, isAgentsLoading } = useAdminDashboardViewModel();
  const { user } = useAuthViewModel();
  const [breakdown, setBreakdown] = useState<BreakdownKey>('agencies');

  const displayName = (user?.user_metadata?.display_name as string | undefined) || user?.email?.split('@')[0] || 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const totals = {
    users: sum(stats?.usersByRole),
    agencies: sum(stats?.agenciesByVerificationStatus),
    listings: sum(stats?.listingsByStatus),
    leads: sum(stats?.leadsByStatus),
    subscriptions: sum(stats?.activeSubscriptionsByTier),
  };

  const usersByRoleData = toChartData(stats?.usersByRole);

  const breakdownRecords: Record<BreakdownKey, Record<string, number> | undefined> = {
    agencies: stats?.agenciesByVerificationStatus,
    listings: stats?.listingsByStatus,
    leads: stats?.leadsByStatus,
    subscriptions: stats?.activeSubscriptionsByTier,
  };
  const breakdownData = toChartData(breakdownRecords[breakdown]);
  const breakdownTotal = sum(breakdownRecords[breakdown]);

  const columns: TableColumn<AgentOverview>[] = [
    { key: 'name', header: 'Agent', render: (a) => a.displayName ?? '—' },
    { key: 'phone', header: 'Phone', render: (a) => a.phone ?? '—' },
    { key: 'city', header: 'City', render: (a) => a.city ?? '—' },
    { key: 'agency', header: 'Agency', render: (a) => a.agency?.name ?? 'Independent' },
    {
      key: 'verification',
      header: 'Verification',
      render: (a) => (
        <Badge variant={a.verificationStatus === 'verified' ? 'success' : a.verificationStatus === 'rejected' ? 'destructive' : 'warning'}>
          {a.verificationStatus}
        </Badge>
      ),
    },
    { key: 'plan', header: 'Plan', render: (a) => a.subscription?.tierName ?? '—' },
    { key: 'listings', header: 'Listings', render: (a) => `${a.listingCounts.verified} / ${a.listingCounts.total}` },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sun className="h-4 w-4" />
              {today}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {greeting}, {displayName}.
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totals.agencies ? stats?.agenciesByVerificationStatus?.pending ?? 0 : 0}</span>{' '}
              agencies and <span className="font-semibold text-foreground">{stats?.listingsByStatus?.pending_verification ?? 0}</span> listings
              are awaiting your review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/agencies"
              className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Building2 className="h-4 w-4" />
              Review Agencies
            </Link>
            <Link
              href="/admin/listings"
              className="flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              Listings
            </Link>
            <Link
              href="/admin/crm"
              className="flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Inbox className="h-4 w-4" />
              CRM
            </Link>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {isStatsLoading ? (
          [0, 1, 2, 3, 4].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-[24px] border border-border bg-muted/40" />)
        ) : (
          <>
            {[
              { icon: Users, label: 'Users', value: totals.users, sub: 'Across every role' },
              { icon: Building2, label: 'Agencies', value: totals.agencies, sub: 'Registered' },
              { icon: Home, label: 'Listings', value: totals.listings, sub: 'All statuses' },
              { icon: Inbox, label: 'Leads', value: totals.leads, sub: 'All statuses' },
              { icon: CreditCard, label: 'Subscriptions', value: totals.subscriptions, sub: 'Currently active' },
            ].map((tile, index) => (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <KpiCard index={index} {...tile} />
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Charts: users-by-role bar chart, agencies-by-verification donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Reveal className="lg:col-span-1">
          <div className="h-full rounded-[24px] border border-border bg-background p-4 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Users by Role</h2>
            </div>
            <p className="text-sm text-muted-foreground">How the platform&apos;s accounts break down</p>
            {isStatsLoading ? (
              <div className="mt-6 h-60 animate-pulse rounded-md bg-muted/40" />
            ) : isStatsError ? (
              <EmptyChartState isError />
            ) : usersByRoleData.length === 0 ? (
              <EmptyChartState />
            ) : (
              <div className="mt-4 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usersByRoleData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usersByRoleFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--brand-emerald))" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tickFormatter={(v: string) => v.replace(/_/g, ' ')}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="value" name="Users" fill="url(#usersByRoleFill)" radius={[6, 6, 0, 0]} animationDuration={900} animationEasing="ease-out" maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal>
          <div className="flex h-full flex-col rounded-[24px] border border-border bg-background p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Breakdown</h2>
              </div>
              <Link
                href={BREAKDOWN_TABS.find((t) => t.id === breakdown)!.href}
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1">
              {BREAKDOWN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBreakdown(tab.id)}
                  className={cn(
                    'relative flex-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors',
                    breakdown === tab.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {breakdown === tab.id && (
                    <motion.span
                      layoutId="dashboardBreakdownTab"
                      className="bg-heading-gradient absolute inset-0 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </button>
              ))}
            </div>

            {isStatsLoading ? (
              <div className="mt-4 h-44 flex-1 animate-pulse rounded-md bg-muted/40" />
            ) : isStatsError ? (
              <EmptyChartState compact isError />
            ) : breakdownData.length === 0 ? (
              <EmptyChartState compact />
            ) : (
              <div className="relative mt-2 flex-1">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={4}
                      isAnimationActive
                      animationDuration={600}
                    >
                      {breakdownData.map((d) => (
                        <Cell key={d.name} fill={d.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-foreground">{breakdownTotal}</p>
                  <p className="text-[11px] text-muted-foreground">total</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs capitalize text-muted-foreground">
                  {breakdownData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name.replace(/_/g, ' ')} ({d.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* Agent roster */}
      <Reveal>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-medium text-foreground">
            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            Agents
          </h2>
          <Link href="/admin/agents" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-3">
          <Table columns={columns} rows={agents} rowKey={(a) => a.id} isLoading={isAgentsLoading} emptyMessage="No agents yet." />
        </div>
      </Reveal>
    </div>
  );
}

function EmptyChartState({ compact, isError }: { compact?: boolean; isError?: boolean }) {
  return (
    <div className={`mt-4 flex flex-1 flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-10'}`}>
      <ShieldCheck className={`mb-2 h-8 w-8 ${isError ? 'text-destructive/50' : 'text-muted-foreground/40'}`} />
      <p className={`text-xs ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>
        {isError ? "Couldn't load this — please try again." : 'No data yet.'}
      </p>
    </div>
  );
}

