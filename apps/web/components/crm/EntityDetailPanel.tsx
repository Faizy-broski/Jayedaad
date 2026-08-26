'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  resolveAgentDisplayName,
  useAdminAgenciesViewModel,
  useAdminAgentsViewModel,
  useAgencyRevenueViewModel,
  useFormattedPrice,
  useRevenueViewModel,
} from '@jayedaad/core';
import { KpiCard } from '@jayedaad/ui-web';
import { AlertTriangle, Banknote, Building2, Handshake, ImageOff, Mail, MapPin, Phone, ShieldCheck, TrendingUp, Users, Wallet, X } from 'lucide-react';
import type { PickerSelection } from './AgentAgencyPicker';

type Period = 'month' | 'quarter' | 'year';

const PERIOD_FILTERS: { id: Period; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

// Same tooltip shape as revenue/page.tsx's local ChartTooltip — no shared
// export exists yet, matches the established per-page-copy precedent.
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

function TrendChart({ trendData, isLoading, period }: { trendData: { label: string; revenue: number }[]; isLoading: boolean; period: Period }) {
  return (
    <div className="rounded-[24px] border border-border bg-background p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Revenue trend</h3>
      <p className="text-xs text-muted-foreground">Commission revenue by {period}</p>
      {isLoading ? (
        <div className="mt-4 h-52 animate-pulse rounded-md bg-muted/40" />
      ) : trendData.length === 0 ? (
        <div className="mt-4 flex h-52 flex-col items-center justify-center text-center">
          <ImageOff className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No deals closed yet.</p>
        </div>
      ) : (
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="entityRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="revenue" name="Revenue" fill="url(#entityRevenueFill)" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function PeriodToggle({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex w-fit gap-1 rounded-full border border-border bg-muted/40 p-1">
      {PERIOD_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`relative rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            period === f.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {period === f.id && (
            <motion.span
              layoutId="entityPanelPeriodPill"
              className="bg-heading-gradient absolute inset-0 rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative">{f.label}</span>
        </button>
      ))}
    </div>
  );
}

function AgentBranch({ agentId, period, onPeriodChange }: { agentId: string; period: Period; onPeriodChange: (p: Period) => void }) {
  const { agents } = useAdminAgentsViewModel();
  const { format: formatPrice } = useFormattedPrice();
  const agent = agents.find((a) => a.id === agentId);
  const { revenue, isRevenueLoading, isRevenueError } = useRevenueViewModel(agentId, { period, scope: 'own' });

  const totalRevenue = revenue?.totalRevenue ?? 0;
  const dealCount = revenue?.dealCount ?? 0;
  const avgDealValue = dealCount > 0 ? totalRevenue / dealCount : 0;
  const trendData = (revenue?.byPeriod ?? []).map((point) => ({ label: point.period, revenue: point.revenue }));

  if (!agent) return <p className="p-6 text-sm text-muted-foreground">Agent not found.</p>;

  return (
    <div className="space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{resolveAgentDisplayName(agent)}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {agent.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {agent.email}
            </span>
          )}
          {agent.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {agent.phone}
            </span>
          )}
          {agent.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {agent.city}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium capitalize text-primary">
            <ShieldCheck className="h-3 w-3" />
            {agent.verificationStatus}
          </span>
          {agent.agency && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
              <Building2 className="h-3 w-3" />
              {agent.agency.name}
              {agent.isAgencyAdmin ? ' · Admin' : ''}
            </span>
          )}
        </div>
      </div>

      <PeriodToggle period={period} onChange={onPeriodChange} />

      {isRevenueError ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
          <AlertTriangle className="mb-2 h-6 w-6 text-destructive/60" />
          <p className="text-xs text-destructive">Couldn&apos;t load revenue.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {isRevenueLoading
              ? [0, 1, 2].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-[24px] border border-border bg-muted/40" />)
              : [
                  { icon: Wallet, label: 'Revenue', value: formatPrice(totalRevenue), sub: `This ${period}` },
                  { icon: Handshake, label: 'Deals', value: dealCount, sub: `This ${period}` },
                  { icon: Banknote, label: 'Avg Deal', value: formatPrice(avgDealValue), sub: 'Per deal' },
                ].map((tile, index) => <KpiCard key={tile.label} index={index} {...tile} />)}
          </div>
          <TrendChart trendData={trendData} isLoading={isRevenueLoading} period={period} />
        </>
      )}
    </div>
  );
}

function AgencyBranch({ agencyId, period, onPeriodChange }: { agencyId: string; period: Period; onPeriodChange: (p: Period) => void }) {
  const { agencies } = useAdminAgenciesViewModel();
  const { format: formatPrice } = useFormattedPrice();
  const agency = agencies.find((a) => a.id === agencyId);
  const { revenue, isRevenueLoading, isRevenueError } = useAgencyRevenueViewModel(agencyId, period);

  const totalRevenue = revenue?.totalRevenue ?? 0;
  const dealCount = revenue?.dealCount ?? 0;
  const avgDealValue = dealCount > 0 ? totalRevenue / dealCount : 0;
  const trendData = (revenue?.byPeriod ?? []).map((point) => ({ label: point.period, revenue: point.revenue }));
  const sortedByAgent = [...(revenue?.byAgent ?? [])].sort((a, b) => b.revenue - a.revenue);

  if (!agency) return <p className="p-6 text-sm text-muted-foreground">Agency not found.</p>;

  return (
    <div className="space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{agency.name}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {agency.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {agency.city}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {agency.salesAssociateCount} staff
          </span>
          {agency.defaultCommissionRate != null && <span>{agency.defaultCommissionRate}% commission</span>}
        </div>
        <div className="mt-2">
          <span className="flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium capitalize text-primary">
            <ShieldCheck className="h-3 w-3" />
            {agency.verificationStatus}
          </span>
        </div>
      </div>

      <PeriodToggle period={period} onChange={onPeriodChange} />

      {isRevenueError ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
          <AlertTriangle className="mb-2 h-6 w-6 text-destructive/60" />
          <p className="text-xs text-destructive">Couldn&apos;t load revenue.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {isRevenueLoading
              ? [0, 1, 2].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-[24px] border border-border bg-muted/40" />)
              : [
                  { icon: Wallet, label: 'Revenue', value: formatPrice(totalRevenue), sub: `This ${period}` },
                  { icon: Handshake, label: 'Deals', value: dealCount, sub: `This ${period}` },
                  { icon: Banknote, label: 'Avg Deal', value: formatPrice(avgDealValue), sub: 'Per deal' },
                ].map((tile, index) => <KpiCard key={tile.label} index={index} {...tile} />)}
          </div>
          <TrendChart trendData={trendData} isLoading={isRevenueLoading} period={period} />

          <div className="rounded-[24px] border border-border bg-background p-4 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Revenue by agent
            </h3>
            {isRevenueLoading ? (
              <div className="mt-3 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-md bg-muted/40" />
                ))}
              </div>
            ) : sortedByAgent.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No deals closed by any associate yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {sortedByAgent.map((a) => (
                  <li key={a.agentId} className="flex items-center justify-between gap-3 py-2.5">
                    <p className="truncate text-sm font-medium text-foreground">{a.displayName ?? 'Unnamed agent'}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {a.dealCount} deal{a.dealCount === 1 ? '' : 's'} · <span className="font-semibold text-foreground">{formatPrice(a.revenue)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Inline card merged directly into the CRM page's own flow — not a
// docked/modal side panel (rejected: revenue should show in the CRM page
// itself, not open a separate drawer). Collapses to nothing when no
// agent/agency is selected.
export function EntityDetailPanel({ selection, onClose }: { selection: PickerSelection; onClose: () => void }) {
  const [period, setPeriod] = useState<Period>('month');

  return (
    <AnimatePresence initial={false}>
      {selection && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="rounded-[24px] border border-border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {selection.type === 'agency' ? <Building2 className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                {selection.type === 'agency' ? 'Agency details' : 'Agent details'}
              </p>
              <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selection.type === 'agent' ? (
              <AgentBranch agentId={selection.id} period={period} onPeriodChange={setPeriod} />
            ) : (
              <AgencyBranch agencyId={selection.id} period={period} onPeriodChange={setPeriod} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
