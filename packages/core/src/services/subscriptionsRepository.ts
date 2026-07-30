import { httpClient } from './httpClient';
import {
  AssignSubscriptionInput,
  CreateSubscriptionTierInput,
  Subscription,
  SubscriptionTier,
  SubscriptionUsage,
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
    price: row.price,
    analyticsDepth: row.analytics_depth,
  };
}

function mapSubscriptionRow(row: any): Subscription {
  return {
    agentId: row.agent_id,
    tierId: row.tier_id,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    tier: mapTierRow(row.subscription_tiers),
  };
}

export const subscriptionsRepository = {
  // Public — agents need to see available plans before upgrading.
  listTiers: async (): Promise<SubscriptionTier[]> => {
    const { data } = await httpClient.get('/subscription-tiers');
    return (data as any[]).map(mapTierRow);
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

  // No payment/billing integration exists in this app — this is a real,
  // immediate tier change, not a checkout flow. The Plan page UI flags this.
  selectTier: async (input: AssignSubscriptionInput): Promise<Subscription> => {
    const { data } = await httpClient.post('/subscriptions/me/select', input);
    return mapSubscriptionRow(data);
  },

  // Super Admin-only — assigns/changes any agent's plan.
  assignToAgent: async (agentId: string, input: AssignSubscriptionInput): Promise<Subscription> => {
    const { data } = await httpClient.patch(`/subscriptions/${agentId}/assign`, input);
    return mapSubscriptionRow(data);
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
