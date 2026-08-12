'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  useAgencyAnalyticsViewModel,
  useAgentDashboardViewModel,
  useSubscriptionViewModel,
  useFormattedPrice,
  useLeadInboxViewModel,
  useAgentProfileViewModel,
  useAuthViewModel,
  useTasksViewModel,
  AgentCreditType,
} from '@jayedaad/core';
import { Card, Button, Input } from '@jayedaad/ui-web';
import {
  Home,
  Flame,
  Sparkles,
  ImageOff,
  PlusCircle,
  Sun,
  Eye,
  MousePointerClick,
  Phone,
  MessageCircle,
  Smartphone,
  Mail,
  Users,
  Inbox,
  ArrowRight,
  Gauge,
  CreditCard as CreditCardIcon,
  TrendingUp,
  Circle,
  ListTodo,
  Clapperboard,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const CREDIT_TABS: { id: AgentCreditType; label: string; icon: typeof Home }[] = [
  { id: 'listing_quota', label: 'Quota', icon: Home },
  { id: 'refresh', label: 'Refresh', icon: TrendingUp },
  { id: 'hot', label: 'Hot', icon: Sparkles },
  { id: 'super_hot', label: 'Super Hot', icon: Flame },
  { id: 'story', label: 'Story', icon: Clapperboard },
];

const PURPOSE_FILTERS = [
  { id: undefined, label: 'All' },
  { id: 'sale' as const, label: 'For Sale' },
  { id: 'rent' as const, label: 'For Rent' },
];

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  verified: { label: 'Verified', className: 'bg-primary/10 text-primary' },
  pending_verification: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground' },
  downgraded: { label: 'Downgraded', className: 'bg-muted text-muted-foreground' },
  deleted: { label: 'Deleted', className: 'bg-muted text-muted-foreground' },
};

// Themed tooltip — recharts renders its own unstyled default, this matches
// the rest of the app's card/shadow language instead.
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

// Zameen "Profolio" Dashboard reference, restyled to match the admin
// dashboard's visual language (greeting header, stat tiles, chart cards,
// list cards, promo banner) — every number here is still real (AgentStats/
// AgentCredit/AgentAnalytics/Subscription/Lead, already built server-side),
// same as the original page this replaces; a fresh agent account shows all
// zeros rather than any placeholder/sample data, since (unlike the admin
// dashboard) every section here has a real agent-scoped data source.
export default function AgentDashboardPage() {
  const [activeCreditTab, setActiveCreditTab] = useState<AgentCreditType>('listing_quota');
  const [purposeFilter, setPurposeFilter] = useState<'sale' | 'rent' | undefined>(undefined);

  const { user } = useAuthViewModel();
  const { profile } = useAgentProfileViewModel();
  const {
    stats,
    isStatsLoading,
    credits,
    isCreditsLoading,
    analytics,
    isAnalyticsLoading,
    recentListings,
    isRecentListingsLoading,
    isRecentListingsError,
  } = useAgentDashboardViewModel({ purpose: purposeFilter });
  const { current: currentPlan } = useSubscriptionViewModel();
  const { format: formatPrice } = useFormattedPrice();
  const { leads, isLoading: isLeadsLoading, isError: isLeadsError } = useLeadInboxViewModel({});
  const {
    openTasks,
    isLoading: isTasksLoading,
    isError: isTasksError,
    create: createTask,
    complete: completeTask,
  } = useTasksViewModel();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  // Agency Admin's "full visibility to their overall performance, analytics,
  // and their sales associates" (Document Verification Phase 3).
  const { analytics: agencyAnalytics } = useAgencyAnalyticsViewModel(profile?.isAgencyAdmin ? profile.agency?.id : undefined);

  const displayName = profile?.displayName || (user?.user_metadata?.display_name as string | undefined) || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const activeListings = (stats?.forSaleCount ?? 0) + (stats?.forRentCount ?? 0);
  const newLeadsCount = leads.filter((l) => l.status === 'new').length;
  const recentLeads = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const listingQuotaCredit = credits.find((c) => c.creditType === 'listing_quota');
  const activeCredit = credits.find((c) => c.creditType === activeCreditTab);
  const activeCreditPct = activeCredit && activeCredit.total > 0 ? Math.min(100, (activeCredit.used / activeCredit.total) * 100) : 0;

  const engagementData = [
    { label: 'Clicks', value: analytics?.clicks ?? 0, icon: MousePointerClick },
    { label: 'Leads', value: analytics?.leads ?? 0, icon: Users },
    { label: 'Calls', value: analytics?.calls ?? 0, icon: Phone },
    { label: 'WhatsApp', value: analytics?.whatsapp ?? 0, icon: MessageCircle },
    { label: 'SMS', value: analytics?.sms ?? 0, icon: Smartphone },
    { label: 'Emails', value: analytics?.emails ?? 0, icon: Mail },
  ];

  const listingsMix = [
    { name: 'For Sale', value: stats?.forSaleCount ?? 0, color: 'hsl(var(--primary))' },
    { name: 'For Rent', value: stats?.forRentCount ?? 0, color: 'hsl(var(--brand-emerald))' },
  ];
  const hasListingsMix = listingsMix.some((d) => d.value > 0);

  function handleAddTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    createTask.mutate(
      { title },
      {
        onSuccess: () => setNewTaskTitle(''),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting header */}
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
              You have <span className="font-semibold text-foreground">{activeListings}</span> active listings and{' '}
              <span className="font-semibold text-foreground">{newLeadsCount}</span> new inquiries since morning.
              Everything is on track.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/submit"
              className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <PlusCircle className="h-4 w-4" />
              Post Listing
            </Link>
            <Link
              href="/property-management"
              className="flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              My Listings
            </Link>
            <Link
              href="/crm"
              className="flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Inbox className="h-4 w-4" />
              View Inbox
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {isStatsLoading || isAnalyticsLoading ? (
          [0, 1, 2, 3, 4].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />)
        ) : (
          <>
            <StatTile index={0} icon={Home} label="Total Listings" value={activeListings} sub="For sale & rent" />
            <StatTile index={1} icon={Home} label="For Sale" value={stats?.forSaleCount ?? 0} sub="Active" />
            <StatTile index={2} icon={Home} label="For Rent" value={stats?.forRentCount ?? 0} sub="Active" />
            <StatTile index={3} icon={Users} label="Leads" value={analytics?.leads ?? 0} sub="Last 30 days" />
            <StatTile index={4} icon={Eye} label="Views" value={analytics?.views ?? 0} sub="Last 30 days" />
          </>
        )}
      </div>

      {/* Agency Performance — Admin-only rollup across every sales associate */}
      {profile?.isAgencyAdmin && agencyAnalytics && (
        <Reveal>
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">Agency Performance</h2>
            <p className="text-sm text-muted-foreground">Every sales associate in your agency</p>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile index={0} icon={Home} label="Listings" value={agencyAnalytics.totals.forSaleCount + agencyAnalytics.totals.forRentCount} sub="For sale & rent" />
              <StatTile index={1} icon={Users} label="Leads" value={agencyAnalytics.totals.leads} sub="Last 30 days" />
              <StatTile index={2} icon={Users} label="Closings" value={agencyAnalytics.totals.closingsCount} sub="All time" />
              <StatTile index={3} icon={Eye} label="Views" value={agencyAnalytics.totals.views} sub="Last 30 days" />
            </div>

            <ul className="mt-4 divide-y divide-border">
              {agencyAnalytics.associates.map((a) => (
                <li key={a.agentId} className="flex items-center justify-between gap-3 py-3">
                  <p className="truncate text-sm font-medium text-foreground">
                    {a.displayName ?? 'Unnamed'}
                    {a.isAgencyAdmin && <span className="ml-1.5 text-xs text-muted-foreground">(Admin)</span>}
                  </p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {a.stats.forSaleCount + a.stats.forRentCount} listings · {a.analytics.leads} leads · {a.closingsCount} closed
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      )}

      {/* Charts: engagement bar chart, credits radial gauge, listings mix donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Reveal className="lg:col-span-1">
          <Card className="h-full p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Listing engagement</h2>
                <p className="text-sm text-muted-foreground">How buyers are reaching out to you</p>
              </div>
              <div className="flex gap-2">
                {PURPOSE_FILTERS.map((f) => (
                  <Button key={f.label} size="sm" variant={purposeFilter === f.id ? 'primary' : 'outline'} onClick={() => setPurposeFilter(f.id)}>
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
            {isAnalyticsLoading ? (
              <div className="mt-6 h-60 animate-pulse rounded-md bg-muted/40" />
            ) : (
              <div className="mt-4 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="engagementFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--brand-emerald))" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="value" name="Count" fill="url(#engagementFill)" radius={[6, 6, 0, 0]} animationDuration={900} animationEasing="ease-out" maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Reveal>

        <Reveal>
          <Card className="flex h-full flex-col p-4 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">Quota &amp; Credits</h2>
            <p className="text-xs text-muted-foreground">Plan: {currentPlan?.tier.name ?? '—'}</p>

            <div className="mt-3 flex flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1">
              {CREDIT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCreditTab(tab.id)}
                  className={`relative flex-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                    activeCreditTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeCreditTab === tab.id && (
                    <motion.span
                      layoutId="dashboardCreditTab"
                      className="bg-heading-gradient absolute inset-0 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </button>
              ))}
            </div>

            {isCreditsLoading ? (
              <div className="mt-4 h-44 flex-1 animate-pulse rounded-md bg-muted/40" />
            ) : (
              <div className="relative mt-2 flex-1">
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: activeCreditPct }]} startAngle={90} endAngle={-270}>
                    <defs>
                      <linearGradient id="creditGaugeFill" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--brand-emerald))" />
                      </linearGradient>
                    </defs>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={8} fill="url(#creditGaugeFill)" background={{ fill: 'hsl(var(--muted))' }} animationDuration={900} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-foreground">{activeCredit?.available ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground">of {activeCredit?.total ?? 0} available</p>
                </div>
              </div>
            )}
          </Card>
        </Reveal>

        <Reveal>
          <Card className="flex h-full flex-col p-4 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">Listings Mix</h2>
            <p className="text-xs text-muted-foreground">Sale vs. rent split</p>

            {isStatsLoading ? (
              <div className="mt-4 h-44 flex-1 animate-pulse rounded-md bg-muted/40" />
            ) : !hasListingsMix ? (
              <div className="mt-4 flex flex-1 flex-col items-center justify-center text-center">
                <ImageOff className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No listings yet.</p>
              </div>
            ) : (
              <div className="relative mt-2 flex-1">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={listingsMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={72} paddingAngle={4} animationDuration={900}>
                      {listingsMix.map((d) => (
                        <Cell key={d.name} fill={d.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-foreground">{activeListings}</p>
                  <p className="text-[11px] text-muted-foreground">total</p>
                </div>
                <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  {listingsMix.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Reveal>
      </div>

      {/* Recent listings + New inquiries */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Reveal>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">Recent Listings</h2>
              <Link href="/property-management" className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {isRecentListingsLoading ? (
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-md bg-muted/40" />
                ))}
              </div>
            ) : isRecentListingsError ? (
              <p className="mt-4 text-sm text-destructive">Couldn&apos;t load your listings — please try again.</p>
            ) : recentListings.length === 0 ? (
              <div className="mt-6 flex flex-col items-center py-6 text-center">
                <ImageOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <h3 className="text-sm font-semibold text-foreground">No Active Listings</h3>
                <p className="mt-1 text-xs text-muted-foreground">Your active listings will appear here</p>
                <Link href="/submit" className="mt-4">
                  <Button size="sm">
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Post Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {recentListings.map((listing, index) => {
                  const status = STATUS_LABEL[listing.status] ?? STATUS_LABEL.draft;
                  return (
                    <motion.li
                      key={listing.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Home className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{listing.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {listing.city}, {listing.area}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-semibold text-foreground">
                          {formatPrice(Number(listing.price))}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>{status.label}</span>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </Card>
        </Reveal>

        <Reveal>
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">New Inquiries</h2>
              <Link href="/crm" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            {isLeadsLoading ? (
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-md bg-muted/40" />
                ))}
              </div>
            ) : isLeadsError ? (
              <p className="mt-4 text-sm text-destructive">Couldn&apos;t load your inbox — please try again.</p>
            ) : recentLeads.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No inquiries yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {recentLeads.map((lead, index) => (
                  <motion.li
                    key={lead.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(lead.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{lead.message}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>
      </div>

      {/* Follow-ups — services/api's tasks table previously had zero
          backend/UI behind it; a personal to-do list, optionally linked to
          a lead, complements the CRM's per-lead reminders (SetReminderPopover
          on the /crm page). */}
      <Reveal>
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              Follow-ups
            </h2>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Add a follow-up…"
              className="h-9"
            />
            <Button size="sm" disabled={!newTaskTitle.trim() || createTask.isPending} onClick={handleAddTask}>
              Add
            </Button>
          </div>

          {isTasksLoading ? (
            <div className="mt-4 space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-md bg-muted/40" />
              ))}
            </div>
          ) : isTasksError ? (
            <p className="mt-4 text-sm text-destructive">Couldn&apos;t load your tasks — please try again.</p>
          ) : openTasks.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nothing on your list — nice.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {openTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => completeTask.mutate(task.id)}
                    disabled={completeTask.isPending}
                    aria-label="Mark complete"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Circle className="h-4 w-4" />
                  </button>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</span>
                  {task.dueAt && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(task.dueAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>

      {/* Insights + Plan + Promo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal>
          <Card className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-3 rounded-full bg-muted p-3">
              <Gauge className="h-6 w-6 text-primary" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {analytics?.views ?? 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">View In-Depth Insights</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              See the number of views, clicks and leads that your listings have received.
            </p>
          </Card>
        </Reveal>

        <Reveal>
          <Card className="h-full p-6">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <CreditCardIcon className="h-3.5 w-3.5" />
              My Plan
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">{currentPlan?.tier.name ?? 'No active plan'}</p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">{currentPlan?.status ?? '—'}</p>
            {currentPlan?.currentPeriodEnd && (
              <p className="mt-1 text-xs text-muted-foreground">
                Renews {new Date(currentPlan.currentPeriodEnd).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {listingQuotaCredit ? `${listingQuotaCredit.available} of ${listingQuotaCredit.total} listing slots left` : ''}
            </p>
            <Link href="/plan" className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Manage plan <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </Reveal>

        <Reveal>
          <Card className="flex h-full flex-col justify-between overflow-hidden bg-brand-dark p-6 text-white">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Grow faster</p>
              <p className="mt-2 text-lg font-semibold leading-snug">
                Boost a listing to <span className="text-brand-emerald">Hot</span> or{' '}
                <span className="text-brand-emerald">Super Hot</span> to reach more buyers.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Boosted listings surface higher in search and category pages.
              </p>
            </div>
            <Link
              href="/property-management"
              className="mt-6 block w-full rounded-full bg-white py-2.5 text-center text-sm font-semibold text-brand-dark hover:bg-white/90"
            >
              Boost a listing
            </Link>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

function StatTile({
  index,
  icon: Icon,
  label,
  value,
  sub,
}: {
  index: number;
  icon: typeof Home;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <Card className="p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">{value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
      </Card>
    </motion.div>
  );
}
