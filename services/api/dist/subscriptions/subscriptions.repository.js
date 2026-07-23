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
exports.SubscriptionsRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
// The literal fix for "Current Plan: -" showing blank on the real Profolio
// dashboard screenshot from an earlier pass — nothing ever wrote to
// `subscriptions` until this method existed.
let SubscriptionsRepository = class SubscriptionsRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async assign(agentId, input) {
        const { data, error } = await this.supabase.client
            .from('subscriptions')
            .upsert({
            agent_id: agentId,
            tier_id: input.tierId,
            status: 'active',
            current_period_end: input.currentPeriodEnd,
        }, { onConflict: 'agent_id' })
            .select('*, subscription_tiers (*)')
            .single();
        if (error)
            throw error;
        return data;
    }
    async findForAgent(agentId) {
        const { data, error } = await this.supabase.client
            .from('subscriptions')
            .select('*, subscription_tiers (*)')
            .eq('agent_id', agentId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
};
exports.SubscriptionsRepository = SubscriptionsRepository;
exports.SubscriptionsRepository = SubscriptionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], SubscriptionsRepository);
