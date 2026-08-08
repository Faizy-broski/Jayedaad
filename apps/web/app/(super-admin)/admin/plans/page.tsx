'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CreateSubscriptionTierInput,
  SubscriptionTier,
  formatPrice,
  useAdminAgentsViewModel,
  usePlanManagementViewModel,
} from '@jayedaad/core';
import { Button, Input, Label, Modal, Select } from '@jayedaad/ui-web';
import { ArrowRightLeft, BarChart3, CreditCard, Home, Layers, Pencil, PlusCircle, Sparkles, Trash2, Users } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const EMPTY_FORM: CreateSubscriptionTierInput = {
  name: '',
  listingQuota: 0,
  price: 0,
  analyticsDepth: { analyticsDepth: 'basic', viewCountDetail: 'total_only' },
  hotCreditsPerPeriod: 0,
  superHotCreditsPerPeriod: 0,
  stripePriceId: '',
  listingDurationDays: null,
};

const ANALYTICS_DEPTH_OPTIONS = ['basic', 'standard', 'advanced', 'full'] as const;
const VIEW_COUNT_DETAIL_OPTIONS = ['total_only', 'breakdown_by_source', 'full_timeseries'] as const;

// Real counts (subscriber-per-tier, average price) derived from the fetched
// tiers/agents lists — same "compute from what's already loaded" approach as
// the Agencies/Agents pages, no fabricated analytics endpoint.
export default function PlansPage() {
  const { tiers, isLoading, createTier, updateTier, removeTier, assignToAgent } = usePlanManagementViewModel();
  const { agents } = useAdminAgentsViewModel();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionTier | null>(null);
  const [form, setForm] = useState<CreateSubscriptionTierInput>(EMPTY_FORM);

  const [assignAgentId, setAssignAgentId] = useState('');
  const [assignTierId, setAssignTierId] = useState('');

  const subscriberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const agent of agents) {
      const tierName = agent.subscription?.tierName;
      if (!tierName) continue;
      counts.set(tierName, (counts.get(tierName) ?? 0) + 1);
    }
    return counts;
  }, [agents]);

  const stats = useMemo(() => {
    const totalSubscribers = agents.filter((a) => a.subscription?.tierName).length;
    const avgPrice = tiers.length > 0 ? tiers.reduce((sum, t) => sum + t.price, 0) / tiers.length : 0;
    const maxQuota = tiers.length > 0 ? Math.max(...tiers.map((t) => t.listingQuota)) : 0;
    return { totalPlans: tiers.length, totalSubscribers, avgPrice, maxQuota };
  }, [tiers, agents]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(tier: SubscriptionTier) {
    setEditing(tier);
    setForm({
      name: tier.name,
      listingQuota: tier.listingQuota,
      price: tier.price,
      analyticsDepth: tier.analyticsDepth,
      hotCreditsPerPeriod: tier.hotCreditsPerPeriod,
      superHotCreditsPerPeriod: tier.superHotCreditsPerPeriod,
      stripePriceId: tier.stripePriceId ?? '',
      listingDurationDays: tier.listingDurationDays,
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (editing) {
      updateTier.mutate(
        { id: editing.id, input: form },
        {
          onSuccess: () => {
            toast.success('Plan updated.');
            setModalOpen(false);
          },
          onError: () => toast.error('Something went wrong — please try again.'),
        },
      );
    } else {
      createTier.mutate(form, {
        onSuccess: () => {
          toast.success('Plan created.');
          setModalOpen(false);
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      });
    }
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete plan "${name}"? Agents currently on this plan will block the delete.`)) return;
    removeTier.mutate(id, {
      onSuccess: () => toast.success('Plan deleted.'),
      onError: () => toast.error('Could not delete — an agent may still be on this plan.'),
    });
  }

  function handleAssign() {
    if (!assignAgentId || !assignTierId) return;
    assignToAgent.mutate(
      { agentId: assignAgentId, input: { tierId: assignTierId } },
      {
        onSuccess: () => toast.success('Plan assigned.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Subscription management
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Plans</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.totalPlans}</span> {stats.totalPlans === 1 ? 'plan' : 'plans'} —{' '}
              <span className="font-semibold text-foreground">{stats.totalSubscribers}</span> active subscribers.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            New Plan
          </button>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />)
        ) : (
          <>
            <StatTile index={0} icon={Layers} label="Total Plans" value={stats.totalPlans} sub="Configured tiers" />
            <StatTile index={1} icon={Users} label="Subscribers" value={stats.totalSubscribers} sub="Agents on a plan" />
            <StatTile index={2} icon={BarChart3} label="Avg. Price" value={Math.round(stats.avgPrice)} sub="Across all plans" isCurrency />
            <StatTile index={3} icon={Home} label="Top Quota" value={stats.maxQuota} sub="Listings, best plan" />
          </>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : tiers.length === 0 ? (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No plans yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">Create a plan to start assigning it to agents.</p>
          </div>
        </Reveal>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier, index) => {
            const subscribers = subscriberCounts.get(tier.name) ?? 0;
            const isTopTier = tier.listingQuota === stats.maxQuota && stats.maxQuota > 0;
            return (
              <motion.li
                key={tier.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.06 }}
              >
                <div
                  className={`relative flex h-full flex-col overflow-hidden rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
                    isTopTier ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'
                  }`}
                >
                  {isTopTier && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      <Sparkles className="h-3 w-3" />
                      Top tier
                    </span>
                  )}

                  <p className="truncate pr-16 text-sm font-semibold text-foreground">{tier.name}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {formatPrice(tier.price)}
                    <span className="text-xs font-normal text-muted-foreground"> /mo</span>
                  </p>

                  <div className="mt-4 flex-1 space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5 shrink-0" />
                      {tier.listingQuota} listing{tier.listingQuota === 1 ? '' : 's'} quota
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      {subscribers} subscriber{subscribers === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(tier)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="ml-auto text-destructive" onClick={() => handleDelete(tier.id, tier.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      <Reveal>
        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <h2 className="flex items-center gap-1.5 font-medium text-foreground">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            Assign a plan to an agent
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Agent</Label>
              <Select value={assignAgentId} onChange={(e) => setAssignAgentId(e.target.value)}>
                <option value="">Select agent</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName ?? a.id}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={assignTierId} onChange={(e) => setAssignTierId(e.target.value)}>
                <option value="">Select plan</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAssign} disabled={assignToAgent.isPending || !assignAgentId || !assignTierId} className="w-full">
                {assignToAgent.isPending ? 'Assigning…' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      </Reveal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'New Plan'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Listing Quota</Label>
            <Input
              type="number"
              value={form.listingQuota}
              onChange={(e) => setForm((prev) => ({ ...prev, listingQuota: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Price (PKR/mo)</Label>
            <Input type="number" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Analytics Depth</Label>
              <Select
                value={(form.analyticsDepth.analyticsDepth as string) ?? 'basic'}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, analyticsDepth: { ...prev.analyticsDepth, analyticsDepth: e.target.value } }))
                }
              >
                {ANALYTICS_DEPTH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>View Count Detail</Label>
              <Select
                value={(form.analyticsDepth.viewCountDetail as string) ?? 'total_only'}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, analyticsDepth: { ...prev.analyticsDepth, viewCountDetail: e.target.value } }))
                }
              >
                {VIEW_COUNT_DETAIL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Hot credits / period</Label>
              <Input
                type="number"
                value={form.hotCreditsPerPeriod}
                onChange={(e) => setForm((prev) => ({ ...prev, hotCreditsPerPeriod: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Super Hot credits / period</Label>
              <Input
                type="number"
                value={form.superHotCreditsPerPeriod}
                onChange={(e) => setForm((prev) => ({ ...prev, superHotCreditsPerPeriod: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Listing duration (days)</Label>
            <Input
              type="number"
              placeholder="Leave blank for unlimited"
              value={form.listingDurationDays ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, listingDurationDays: e.target.value === '' ? null : Number(e.target.value) }))}
            />
            <p className="text-xs text-muted-foreground">
              How long a listing stays live on this plan before it auto-expires. Blank means listings never expire.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Stripe Price ID</Label>
            <Input
              placeholder="price_... (leave blank for a free plan)"
              value={form.stripePriceId}
              onChange={(e) => setForm((prev) => ({ ...prev, stripePriceId: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Required before this plan can be checked out if its price is above 0 — create a matching Product/Price in the Stripe
              dashboard first.
            </p>
          </div>
          <Button onClick={handleSave} disabled={createTier.isPending || updateTier.isPending} className="w-full">
            {createTier.isPending || updateTier.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function StatTile({
  index,
  icon: Icon,
  label,
  value,
  sub,
  isCurrency,
}: {
  index: number;
  icon: typeof CreditCard;
  label: string;
  value: number;
  sub: string;
  isCurrency?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.06 }}>
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">{isCurrency ? formatPrice(value) : value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}
