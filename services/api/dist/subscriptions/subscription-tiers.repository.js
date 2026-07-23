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
exports.SubscriptionTiersRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
// Subscription plans — Super Admin creates/edits/retires them at runtime
// [Reqs §8]. Reads are public: agents need to see available tiers to
// understand what they'd be upgrading to.
let SubscriptionTiersRepository = class SubscriptionTiersRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async list() {
        const { data, error } = await this.supabase.client.from('subscription_tiers').select('*').order('price');
        if (error)
            throw error;
        return data;
    }
    async create(input) {
        const { data, error } = await this.supabase.client
            .from('subscription_tiers')
            .insert({
            name: input.name,
            listing_quota: input.listingQuota,
            price: input.price ?? 0,
            analytics_depth: input.analyticsDepth,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, input) {
        const { data, error } = await this.supabase.client
            .from('subscription_tiers')
            .update({
            name: input.name,
            listing_quota: input.listingQuota,
            price: input.price,
            analytics_depth: input.analyticsDepth,
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Blocked by the FK from subscriptions.tier_id if any agent is currently
    // on this plan — a Postgres FK-violation error, not a silent orphan.
    async remove(id) {
        const { error } = await this.supabase.client.from('subscription_tiers').delete().eq('id', id);
        if (error)
            throw error;
    }
};
exports.SubscriptionTiersRepository = SubscriptionTiersRepository;
exports.SubscriptionTiersRepository = SubscriptionTiersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], SubscriptionTiersRepository);
