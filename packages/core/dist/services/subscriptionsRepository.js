import { httpClient } from './httpClient';
// services/api's subscriptions/subscription-tiers repositories return raw
// snake_case rows (no server-side mapper) — mapped here to match every
// other camelCase model in this package.
function mapTierRow(row) {
    return {
        id: row.id,
        name: row.name,
        listingQuota: row.listing_quota,
        price: row.price,
        analyticsDepth: row.analytics_depth,
    };
}
function mapSubscriptionRow(row) {
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
    listTiers: async () => {
        const { data } = await httpClient.get('/subscription-tiers');
        return data.map(mapTierRow);
    },
    getUsage: async () => {
        const { data } = await httpClient.get('/subscriptions/usage');
        return data;
    },
    // The signed-in agent's own current plan — null if never assigned one.
    getMine: async () => {
        const { data } = await httpClient.get('/subscriptions/me');
        return data ? mapSubscriptionRow(data) : null;
    },
    // No payment/billing integration exists in this app — this is a real,
    // immediate tier change, not a checkout flow. The Plan page UI flags this.
    selectTier: async (input) => {
        const { data } = await httpClient.post('/subscriptions/me/select', input);
        return mapSubscriptionRow(data);
    },
    // Super Admin-only — assigns/changes any agent's plan.
    assignToAgent: async (agentId, input) => {
        const { data } = await httpClient.patch(`/subscriptions/${agentId}/assign`, input);
        return mapSubscriptionRow(data);
    },
    // Super Admin-only plan CRUD.
    createTier: async (input) => {
        const { data } = await httpClient.post('/subscription-tiers', input);
        return mapTierRow(data);
    },
    updateTier: async (id, input) => {
        const { data } = await httpClient.patch(`/subscription-tiers/${id}`, input);
        return mapTierRow(data);
    },
    removeTier: async (id) => {
        await httpClient.delete(`/subscription-tiers/${id}`);
    },
};
