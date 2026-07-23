"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
function countBy(rows, key) {
    const counts = {};
    for (const row of rows) {
        const value = row[key];
        counts[value] = (counts[value] ?? 0) + 1;
    }
    return counts;
}
let AdminRepository = class AdminRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    // The platform-wide rollup nothing so far provides — every other stats
    // endpoint this session is scoped to one agent/agency (AgentsRepository/
    // AgenciesRepository.getStats()). Computed at query time, same discipline
    // as those, not a stored/cached figure.
    async getPlatformStats() {
        const [usersRes, agenciesRes, listingsRes, leadsRes, subscriptionsRes] = await Promise.all([
            this.supabase.client.from('profiles').select('role'),
            this.supabase.client.from('agencies').select('verification_status'),
            this.supabase.client.from('listings').select('status'),
            this.supabase.client.from('leads').select('status'),
            this.supabase.client.from('subscriptions').select('tier_id, subscription_tiers (name)').eq('status', 'active'),
        ]);
        if (usersRes.error)
            throw usersRes.error;
        if (agenciesRes.error)
            throw agenciesRes.error;
        if (listingsRes.error)
            throw listingsRes.error;
        if (leadsRes.error)
            throw leadsRes.error;
        if (subscriptionsRes.error)
            throw subscriptionsRes.error;
        const byTierName = {};
        for (const row of subscriptionsRes.data ?? []) {
            const name = row.subscription_tiers?.name ?? 'Unknown';
            byTierName[name] = (byTierName[name] ?? 0) + 1;
        }
        return {
            usersByRole: countBy(usersRes.data ?? [], 'role'),
            agenciesByVerificationStatus: countBy(agenciesRes.data ?? [], 'verification_status'),
            listingsByStatus: countBy(listingsRes.data ?? [], 'status'),
            leadsByStatus: countBy(leadsRes.data ?? [], 'status'),
            activeSubscriptionsByTier: byTierName,
        };
    }
    // The actual "see all agents' insights at a glance" ask — one row per
    // agent joining profile + agency + listing counts + subscription tier.
    // Nothing else in the codebase rolls agents up across the whole platform.
    async listAgentsOverview() {
        const { data: agents, error: agentsError } = await this.supabase.client
            .from('agent_profiles')
            .select('id, display_name, phone, city, verification_status, agencies (id, name, slug), subscriptions (status, current_period_end, subscription_tiers (name))')
            .order('created_at', { ascending: false });
        if (agentsError)
            throw agentsError;
        const agentIds = (agents ?? []).map((a) => a.id);
        if (agentIds.length === 0)
            return [];
        const { data: listingRows, error: listingsError } = await this.supabase.client
            .from('listings')
            .select('agent_id, status')
            .in('agent_id', agentIds);
        if (listingsError)
            throw listingsError;
        const listingCountsByAgent = new Map();
        for (const row of listingRows ?? []) {
            const agentId = row.agent_id;
            const entry = listingCountsByAgent.get(agentId) ?? { total: 0, verified: 0 };
            entry.total++;
            if (row.status === 'verified')
                entry.verified++;
            listingCountsByAgent.set(agentId, entry);
        }
        return (agents ?? []).map((agent) => ({
            id: agent.id,
            displayName: agent.display_name,
            phone: agent.phone,
            city: agent.city,
            verificationStatus: agent.verification_status,
            agency: agent.agencies ? { id: agent.agencies.id, name: agent.agencies.name, slug: agent.agencies.slug } : null,
            subscription: agent.subscriptions
                ? {
                    status: agent.subscriptions.status,
                    currentPeriodEnd: agent.subscriptions.current_period_end,
                    tierName: agent.subscriptions.subscription_tiers?.name ?? null,
                }
                : null,
            listingCounts: listingCountsByAgent.get(agent.id) ?? { total: 0, verified: 0 },
        }));
    }
};
exports.AdminRepository = AdminRepository;
exports.AdminRepository = AdminRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AdminRepository);
