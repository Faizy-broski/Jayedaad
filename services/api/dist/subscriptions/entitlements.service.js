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
exports.EntitlementsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
// Independent entitlement layer per [Dev Instr §2.3]: "can be adjusted
// independently of the core CRM logic as tiers are finalized." Reads tier
// config from the DB — changing entitlements is a data change, not a deploy.
// Crucially: this NEVER recomputes or duplicates the underlying count in
// `listing_engagement_events` — it only gates how much of the one true number is exposed,
// which is what keeps [Reqs §4.3] parity intact.
let EntitlementsService = class EntitlementsService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getEntitlements(agentId) {
        const { data: subscription, error } = await this.supabase.client
            .from('subscriptions')
            .select('*, subscription_tiers(*)')
            .eq('agent_id', agentId)
            .maybeSingle();
        if (error)
            throw error;
        if (!subscription) {
            // No active subscription: treat as the free "lite" tier defaults.
            return { listingQuota: 50, analyticsDepth: 'basic', viewCountDetail: 'total_only' };
        }
        const tier = subscription.subscription_tiers;
        return {
            listingQuota: tier.listing_quota,
            ...tier.analytics_depth,
        };
    }
    async getListingUsage(agentId) {
        const [entitlements, { count, error }] = await Promise.all([
            this.getEntitlements(agentId),
            this.supabase.client.from('listings').select('id', { count: 'exact', head: true }).eq('agent_id', agentId),
        ]);
        if (error)
            throw error;
        return { used: count ?? 0, quota: entitlements.listingQuota };
    }
    async canCreateListing(agentId) {
        const { used, quota } = await this.getListingUsage(agentId);
        return used < quota;
    }
};
exports.EntitlementsService = EntitlementsService;
exports.EntitlementsService = EntitlementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], EntitlementsService);
