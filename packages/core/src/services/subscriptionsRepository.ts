import { httpClient } from './httpClient';
import {
  AssignSubscriptionInput,
  CreateCreditPackInput,
  CreateSubscriptionTierInput,
  CreditPack,
  Subscription,
  SubscriptionTier,
  SubscriptionUsage,
  UpdateCreditPackInput,
  UpdateSubscriptionTierInput,
} from '../models';

// services/api's subscriptions/subscription-tiers repositories return raw
// snake_case rows (no server-side mapper) — mapped here to match every
// other camelCase model in this package.
function mapTierRow(row: any): SubscriptionTier {
  return {
    id: row.id,
    name: row.name,
    listingQuota: row.listing_quota,
    projectQuota: row.project_quota,
    price: row.price,
    hotCreditsPerPeriod: row.hot_credits_per_period ?? 0,
    superHotCreditsPerPeriod: row.super_hot_credits_per_period ?? 0,
    refreshCreditsPerPeriod: row.refresh_credits_per_period ?? 0,
    storyCreditsPerPeriod: row.story_credits_per_period ?? 0,
    stripePriceId: row.stripe_price_id,
    listingDurationDays: row.listing_duration_days,
  };
}

function mapSubscriptionRow(row: any): Subscription {
  return {
    agentId: row.agent_id,
    tierId: row.tier_id,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
    tier: mapTierRow(row.subscription_tiers),
  };
}

export interface ListTiersFilters {
  page?: number;
  pageSize?: number;
}

export interface PaginatedTiers {
  items: SubscriptionTier[];
  total: number;
  page: number;
  pageSize: number;
}

// services/api's credit-packs repository returns raw snake_case rows (no
// server-side mapper), mirroring mapTierRow above.
function mapCreditPackRow(row: any): CreditPack {
  return {
    id: row.id,
    name: row.name,
    creditType: row.credit_type,
    quantity: row.quantity,
    price: row.price,
    stripePriceId: row.stripe_price_id,
    active: row.active,
  };
}

export const subscriptionsRepository = {
  // Public — agents need to see available plans before upgrading. Dual-mode,
  // mirroring the backend: called with no page/pageSize, resolves to
  // SubscriptionTier[] (the agent-facing upgrade screen); called with
  // either, resolves to a Page shape (the Plans admin table). See
  // subscription-tiers.repository.ts::list's comment for why.
  listTiers: async (filters: ListTiersFilters = {}): Promise<SubscriptionTier[] | PaginatedTiers> => {
    const { data } = await httpClient.get('/subscription-tiers', { params: filters });
    if (Array.isArray(data)) return (data as any[]).map(mapTierRow);
    return { ...data, items: (data.items as any[]).map(mapTierRow) };
  },

  getUsage: async (): Promise<SubscriptionUsage> => {
    const { data } = await httpClient.get('/subscriptions/usage');
    return data;
  },

  // The signed-in agent's own current plan — null if never assigned one.
  getMine: async (): Promise<Subscription | null> => {
    const { data } = await httpClient.get('/subscriptions/me');
    return data ? mapSubscriptionRow(data) : null;
  },

  // Free tiers only (server rejects paid tiers with a 400 pointing at
  // checkoutTier below) — a real, immediate tier change, not a checkout flow.
  selectTier: async (input: AssignSubscriptionInput): Promise<Subscription> => {
    const { data } = await httpClient.post('/subscriptions/me/select', input);
    return mapSubscriptionRow(data);
  },

  // Paid tiers — creates a real Stripe Checkout Session and returns its
  // redirect URL; the Plan page navigates the browser there. The actual
  // subscription row is only written once Stripe's webhook confirms payment,
  // not by this call itself. returnUrl is mobile-only (a jayedaad:// deep
  // link, see PlanScreen.tsx) — web omits it and keeps the server's
  // NEXT_PUBLIC_SITE_URL default.
  checkoutTier: async (tierId: string, returnUrl?: string): Promise<{ url: string | null }> => {
    const { data } = await httpClient.post('/subscriptions/me/checkout', { tierId, returnUrl });
    return data;
  },

  // cancel_at_period_end via Stripe — the plan stays usable until
  // currentPeriodEnd, then lapses. The local row only updates once the
  // webhook processes it, not from this call's response.
  cancelSubscription: async (): Promise<{ cancelAtPeriodEnd: boolean }> => {
    const { data } = await httpClient.post('/subscriptions/me/cancel');
    return data;
  },

  // Stripe-hosted billing portal (invoice history, payment method, Stripe's
  // own cancel UI) — returns a one-time session URL to navigate to.
  getBillingPortalUrl: async (): Promise<{ url: string }> => {
    const { data } = await httpClient.post('/subscriptions/me/billing-portal');
    return data;
  },

  // Super Admin-only — assigns/changes any agent's plan.
  assignToAgent: async (agentId: string, input: AssignSubscriptionInput): Promise<Subscription> => {
    const { data } = await httpClient.patch(`/subscriptions/${agentId}/assign`, input);
    return mapSubscriptionRow(data);
  },

  // Standalone credit top-up purchases — public list (agents need to see
  // what's buyable before checkout), agent-only checkout, Super Admin CRUD.
  listCreditPacks: async (includeInactive = false): Promise<CreditPack[]> => {
    const { data } = await httpClient.get('/credit-packs', { params: includeInactive ? { includeInactive: 'true' } : {} });
    return (data as any[]).map(mapCreditPackRow);
  },

  // Creates a real Stripe Checkout Session (mode: 'payment') and returns its
  // redirect URL — agent_credits itself is only incremented once Stripe's
  // webhook confirms payment, not by this call itself. returnUrl is
  // mobile-only, same convention as checkoutTier above.
  checkoutCreditPack: async (packId: string, returnUrl?: string): Promise<{ url: string | null }> => {
    const { data } = await httpClient.post('/subscriptions/me/credits/checkout', { packId, returnUrl });
    return data;
  },

  // Zameen-style multi-item cart — several different packs, each its own
  // quantity, paid for in one combined Stripe Checkout Session. Same
  // "webhook is the only writer" reasoning as checkoutCreditPack above.
  checkoutCreditCart: async (
    items: { packId: string; quantity: number }[],
    returnUrl?: string,
  ): Promise<{ url: string | null }> => {
    const { data } = await httpClient.post('/subscriptions/me/credits/checkout-cart', { items, returnUrl });
    return data;
  },

  createCreditPack: async (input: CreateCreditPackInput): Promise<CreditPack> => {
    const { data } = await httpClient.post('/credit-packs', input);
    return mapCreditPackRow(data);
  },

  updateCreditPack: async (id: string, input: UpdateCreditPackInput): Promise<CreditPack> => {
    const { data } = await httpClient.patch(`/credit-packs/${id}`, input);
    return mapCreditPackRow(data);
  },

  removeCreditPack: async (id: string): Promise<void> => {
    await httpClient.delete(`/credit-packs/${id}`);
  },

  // Super Admin-only plan CRUD.
  createTier: async (input: CreateSubscriptionTierInput): Promise<SubscriptionTier> => {
    const { data } = await httpClient.post('/subscription-tiers', input);
    return mapTierRow(data);
  },

  updateTier: async (id: string, input: UpdateSubscriptionTierInput): Promise<SubscriptionTier> => {
    const { data } = await httpClient.patch(`/subscription-tiers/${id}`, input);
    return mapTierRow(data);
  },

  removeTier: async (id: string): Promise<void> => {
    await httpClient.delete(`/subscription-tiers/${id}`);
  },
};
