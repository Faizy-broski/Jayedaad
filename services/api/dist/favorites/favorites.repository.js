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
exports.FavoritesRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
// The buyer-dashboard "saved/favorite listings" requirement [Reqs §6]/[Spec §8]
// — every method takes the requesting user's id and scopes the query to it,
// same "no unscoped variant" discipline as leads.repository.ts.
let FavoritesRepository = class FavoritesRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async list(userId) {
        const { data, error } = await this.supabase.client
            .from('favorites')
            .select('id, created_at, listings (id, title, price, city, area, status)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    async add(userId, listingId) {
        const { data, error } = await this.supabase.client
            .from('favorites')
            .insert({ user_id: userId, listing_id: listingId })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async remove(userId, listingId) {
        const { error } = await this.supabase.client
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('listing_id', listingId);
        if (error)
            throw error;
    }
};
exports.FavoritesRepository = FavoritesRepository;
exports.FavoritesRepository = FavoritesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], FavoritesRepository);
