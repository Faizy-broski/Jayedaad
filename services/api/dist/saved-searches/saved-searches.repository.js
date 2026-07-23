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
exports.SavedSearchesRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let SavedSearchesRepository = class SavedSearchesRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async list(userId) {
        const { data, error } = await this.supabase.client
            .from('saved_searches')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    async create(userId, input) {
        const { data, error } = await this.supabase.client
            .from('saved_searches')
            .insert({
            user_id: userId,
            name: input.name,
            filters: input.filters,
            alert_frequency: input.alertFrequency ?? 'daily',
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateAlertFrequency(userId, id, alertFrequency) {
        const { data, error } = await this.supabase.client
            .from('saved_searches')
            .update({ alert_frequency: alertFrequency })
            .eq('id', id)
            .eq('user_id', userId) // scoped even though RLS also enforces this — defense in depth
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async remove(userId, id) {
        const { error } = await this.supabase.client.from('saved_searches').delete().eq('id', id).eq('user_id', userId);
        if (error)
            throw error;
    }
};
exports.SavedSearchesRepository = SavedSearchesRepository;
exports.SavedSearchesRepository = SavedSearchesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], SavedSearchesRepository);
