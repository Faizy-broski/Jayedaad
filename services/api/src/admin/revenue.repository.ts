import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

function sum(rows: { amount: number | string }[] | null): number {
  return (rows ?? []).reduce((total, row) => total + Number(row.amount), 0);
}

export interface RevenueTierBreakdownRow {
  tierId: string;
  tierName: string;
  activeSubscribers: number;
  revenue: number;
}

// Reads `payments` (0065_payments_ledger.sql, written only by
// SubscriptionsController's Stripe webhook via PaymentsRepository) —
// deliberately its own file rather than growing the small, stats-only
// admin.repository.ts, since revenue aggregation has enough surface area
// (several date/source-scoped queries) to warrant separating by concern,
// same as SubscriptionTiersRepository/CreditPacksRepository already live
// apart from SubscriptionsRepository under subscriptions/.
@Injectable()
export class RevenueRepository {
  constructor(private readonly supabase: SupabaseService) {}

  // Subscription revenue and credit revenue are kept as two separate
  // totals (not combined into one "Total Earnings" figure) per product
  // decision — each source is real historical cash, but they answer
  // different questions (recurring plan revenue vs. one-off top-ups).
  // ledgerStartsAt is null on a freshly migrated, zero-payments database —
  // the dashboard must render that as "tracking starts once your first
  // payment lands", never a bare "PKR 0" implying a false all-time total.
  async getRevenueSummary(): Promise<{
    subscriptionRevenue: number;
    creditRevenue: number;
    currency: string;
    ledgerStartsAt: string | null;
  }> {
    const [subRes, creditRes, minRes] = await Promise.all([
      this.supabase.client.from('payments').select('amount').in('source', ['subscription_new', 'subscription_renewal']),
      this.supabase.client.from('payments').select('amount').in('source', ['credit_pack', 'credit_cart']),
      this.supabase.client.from('payments').select('created_at').order('created_at', { ascending: true }).limit(1).maybeSingle(),
    ]);
    if (subRes.error) throw subRes.error;
    if (creditRes.error) throw creditRes.error;
    if (minRes.error) throw minRes.error;

    return {
      subscriptionRevenue: sum(subRes.data),
      creditRevenue: sum(creditRes.data),
      currency: 'PKR',
      ledgerStartsAt: minRes.data?.created_at ?? null,
    };
  }

  // Per-tier revenue (real, historical, from `payments`) merged with the
  // CURRENT active-subscriber count (from `subscriptions`) — two different
  // sources on purpose: a tier's all-time revenue and its right-now
  // subscriber count aren't the same query and shouldn't be forced into
  // one (an agent who churned still contributed real historical revenue,
  // but no longer counts as an active subscriber).
  async getTierBreakdown(): Promise<RevenueTierBreakdownRow[]> {
    const [revenueRes, activeRes] = await Promise.all([
      this.supabase.client
        .from('payments')
        .select('tier_id, amount, subscription_tiers(name)')
        .in('source', ['subscription_new', 'subscription_renewal'])
        .not('tier_id', 'is', null),
      this.supabase.client.from('subscriptions').select('tier_id, subscription_tiers(name)').eq('status', 'active'),
    ]);
    if (revenueRes.error) throw revenueRes.error;
    if (activeRes.error) throw activeRes.error;

    const byTier = new Map<string, RevenueTierBreakdownRow>();

    function ensure(tierId: string, tierName: string): RevenueTierBreakdownRow {
      let row = byTier.get(tierId);
      if (!row) {
        row = { tierId, tierName, activeSubscribers: 0, revenue: 0 };
        byTier.set(tierId, row);
      }
      return row;
    }

    for (const r of revenueRes.data ?? []) {
      const row = r as any;
      if (!row.tier_id) continue;
      const entry = ensure(row.tier_id, row.subscription_tiers?.name ?? 'Unknown plan');
      entry.revenue += Number(row.amount);
    }
    for (const r of activeRes.data ?? []) {
      const row = r as any;
      if (!row.tier_id) continue;
      const entry = ensure(row.tier_id, row.subscription_tiers?.name ?? 'Unknown plan');
      entry.activeSubscribers += 1;
    }

    return Array.from(byTier.values());
  }
}
