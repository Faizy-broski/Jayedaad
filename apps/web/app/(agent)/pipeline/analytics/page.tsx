'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAgentProfileViewModel, useFormattedPrice, useOpportunityFunnelViewModel } from '@jayedaad/core';
import { KpiCard } from '@jayedaad/ui-web';
import { AlertTriangle, ArrowRight, BarChart3, Percent, TrendingUp, Wallet } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const STAGE_LABEL: Record<string, string> = {
  qualification: 'Qualification',
  needs_analysis: 'Needs Analysis',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-muted-foreground">
          {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// Funnel & conversion analytics (Phase 4 of the CRM maturity build-out) —
// kept as its own page rather than folded into revenue/page.tsx, whose
// identity is closed/realized commission; blending in open/forecasted
// pipeline numbers would blur that distinction. A small cross-link between
// the two pages is enough for discoverability.
export default function PipelineAnalyticsPage() {
  const { profile } = useAgentProfileViewModel();
  const [agencyScope, setAgencyScope] = useState(false);
  const { format: formatPrice } = useFormattedPrice();
  const { funnel, isLoading, isError, refetch } = useOpportunityFunnelViewModel({ scope: agencyScope ? 'agency' : 'own' });

  const chartData = (funnel?.stageConversion ?? []).map((s) => ({
    name: STAGE_LABEL[s.stage] ?? s.stage,
    value: s.reachedCount,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunity Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Funnel conversion, open opportunity value, and forecasted revenue.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profile?.isAgencyAdmin && (
            <button
              type="button"
              onClick={() => setAgencyScope((v) => !v)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                agencyScope ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-muted-foreground hover:text-foreground'
              }`}
            >
              {agencyScope ? 'Showing: Whole Agency' : 'Show Whole Agency'}
            </button>
          )}
          <Link href="/revenue" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Closed deals & revenue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-[24px] border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold text-foreground">Couldn&apos;t load your opportunity analytics</p>
          <button type="button" onClick={() => refetch()} className="text-xs font-medium text-primary hover:underline">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && funnel && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard index={0} icon={Wallet} label="Open Value" value={formatPrice(funnel.openPipelineValue)} sub={`${funnel.openPipelineCount} open`} />
            <KpiCard index={1} icon={TrendingUp} label="Forecasted Revenue" value={formatPrice(funnel.forecastedRevenue)} sub="Probability-weighted" />
            <KpiCard
              index={2}
              icon={Percent}
              label="Win/Loss Ratio"
              value={funnel.winLossRatio != null ? funnel.winLossRatio.toFixed(2) : '—'}
              sub={`${funnel.won} won · ${funnel.lost} lost`}
            />
            <KpiCard index={3} icon={BarChart3} label="Reached Qualification" value={funnel.stageConversion[0]?.reachedCount ?? 0} sub="All-time" />
          </div>

          <Reveal>
            <div className="rounded-[24px] border border-border bg-background p-4 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-foreground">Stage Conversion</h2>
              <p className="text-sm text-muted-foreground">
                How many opportunities ever reached each stage — a still-open opportunity counts toward every stage it already passed
                through.
              </p>
              {chartData.every((d) => d.value === 0) ? (
                <div className="mt-6 flex flex-col items-center py-10 text-center">
                  <BarChart3 className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No opportunities yet — convert a lead to see your funnel.</p>
                </div>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                      <Bar dataKey="value" name="Reached" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={56} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {funnel.stageConversion.map((s) => (
                  <span key={s.stage}>
                    {STAGE_LABEL[s.stage] ?? s.stage}: {s.conversionFromPrevious != null ? `${s.conversionFromPrevious}%` : '—'}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}
