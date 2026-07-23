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
exports.NotificationsRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
// In-app notification feed [Spec §2]. No public POST endpoint — notifications
// are created by other backend processes (verification actions, lead
// assignment, price-drop detection), never directly by a client. `create()`
// exists here for those future internal call sites to use; actual FCM/APNs
// push delivery is a separate, later integration.
let NotificationsRepository = class NotificationsRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async list(userId) {
        const { data, error } = await this.supabase.client
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    async markRead(userId, id) {
        const { data, error } = await this.supabase.client
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async markAllRead(userId) {
        const { error } = await this.supabase.client
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .is('read_at', null);
        if (error)
            throw error;
    }
    async create(input) {
        const { data, error } = await this.supabase.client
            .from('notifications')
            .insert({
            user_id: input.userId,
            type: input.type,
            title: input.title,
            body: input.body,
            related_listing_id: input.relatedListingId,
            related_lead_id: input.relatedLeadId,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
};
exports.NotificationsRepository = NotificationsRepository;
exports.NotificationsRepository = NotificationsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], NotificationsRepository);
