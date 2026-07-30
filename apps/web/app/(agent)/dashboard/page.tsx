'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useAgentDashboardViewModel,
  useSubscriptionViewModel,
  usePreferencesViewModel,
  formatPrice,
  AgentCreditType,
} from '@jayedaad/core';
import { Button, Card, CardContent, Tabs } from '@jayedaad/ui-web';
import { Home, Flame, Sparkles, BarChart3, ImageOff, PlusCircle } from 'lucide-react';

const CREDIT_TABS: { id: AgentCreditType; label: string }[] = [
  { id: 'listing_quota', label: 'Listing Quota' },
  { id: 'refresh', label: 'Refresh Credits' },
  { id: 'hot', label: 'Hot Credits' },
  { id: 'super_hot', label: 'Super Hot Credits' },
];

const PURPOSE_FILTERS = [
  { id: undefined, label: 'All' },
  { id: 'sale' as const, label: 'For Sale' },
  { id: 'rent' as const, label: 'For Rent' },
];

// Zameen "Profolio" Dashboard reference — listings-by-type row, Quota &
// Credits tabbed panel, engagement stats with purpose filters, an insights
// teaser, and Recent Listings. Every number here is real (AgentStats/
// AgentCredit/AgentAnalytics, already built server-side) — a fresh agent
// account will show all zeros, same as the reference screenshot itself.
export default function AgentDashboardPage() {
  const [activeCreditTab, setActiveCreditTab] = useState<AgentCreditType>('listing_quota');
  const [purposeFilter, setPurposeFilter] = useState<'sale' | 'rent' | undefined>(undefined);

  const { stats, credits, analytics, recentListings, isRecentListingsLoading } = useAgentDashboardViewModel({
    purpose: purposeFilter,
  });
  const { current: currentPlan } = useSubscriptionViewModel();
  const { preferences } = usePreferencesViewModel();

  const activeCredit = credits.find((c) => c.creditType === activeCreditTab);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">My Listings</h2>
              <Link href="/search" className="text-sm font-medium text-primary hover:underline">
                View all Listings
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatTile icon={Home} label="For Sale" value={stats?.forSaleCount ?? 0} />
              <StatTile icon={Home} label="For Rent" value={stats?.forRentCount ?? 0} />
              <StatTile
                icon={Flame}
                label="Super Hot"
                value={stats?.byBoostTier.find((b) => b.tier === 'super_hot')?.count ?? 0}
              />
              <StatTile icon={Sparkles} label="Hot" value={stats?.byBoostTier.find((b) => b.tier === 'hot')?.count ?? 0} />
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Quota and Credits</h2>
            <Tabs
              tabs={CREDIT_TABS.map((t) => ({ id: t.id, label: `${t.label} (${credits.find((c) => c.creditType === t.id)?.available ?? 0})` }))}
              activeId={activeCreditTab}
              onChange={(id) => setActiveCreditTab(id as AgentCreditType)}
              className="mb-4"
            />
            <div className="grid grid-cols-4 gap-4">
              <QuotaFigure label="Available Quota" value={activeCredit?.available ?? 0} />
              <QuotaFigure label="Used" value={activeCredit?.used ?? 0} />
              <QuotaFigure label="Total" value={activeCredit?.total ?? 0} />
              <div>
                <p className="text-xs text-muted-foreground">Current Plan</p>
                <p className="mt-1 text-lg font-semibold">{currentPlan?.tier.name ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {PURPOSE_FILTERS.map((f) => (
                <Button
                  key={f.label}
                  size="sm"
                  variant={purposeFilter === f.id ? 'primary' : 'outline'}
                  onClick={() => setPurposeFilter(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Last 30 Days</span>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            <StatFigure label="Clicks" value={analytics?.clicks ?? 0} />
            <StatFigure label="Leads" value={analytics?.leads ?? 0} />
            <StatFigure label="Calls" value={analytics?.calls ?? 0} />
            <StatFigure label="WhatsApp" value={analytics?.whatsapp ?? 0} />
            <StatFigure label="SMS" value={analytics?.sms ?? 0} />
            <StatFigure label="Emails" value={analytics?.emails ?? 0} />
          </div>

          <div className="mt-8 flex flex-col items-center rounded-lg border border-dashed border-border py-10 text-center">
            <div className="relative mb-3 rounded-full bg-muted p-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {analytics?.views ?? 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold">View In-Depth Insights</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              See the number of views, clicks and leads that your listing has received.
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Listings</h2>
          <Link href="/search" className="text-sm font-medium text-muted-foreground hover:underline">
            View All Listings
          </Link>
        </div>

        <Card>
          <CardContent className="p-10">
            {isRecentListingsLoading ? (
              <p className="text-center text-sm text-muted-foreground">Loading…</p>
            ) : recentListings.length === 0 ? (
              <div className="flex flex-col items-center text-center">
                <ImageOff className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <h3 className="text-sm font-semibold">No Active Listings</h3>
                <p className="mt-1 text-xs text-muted-foreground">Your active listings will appear here</p>
                <Link href="/submit" className="mt-4">
                  <Button size="sm">
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Post Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentListings.map((listing) => (
                  <li key={listing.id} className="flex items-center justify-between py-3 text-sm">
                    <span className="font-medium">{listing.title}</span>
                    <span className="text-muted-foreground">
                      {listing.area}, {listing.city} — {formatPrice(Number(listing.price), preferences?.preferredCurrency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-md bg-muted p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function QuotaFigure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function StatFigure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
