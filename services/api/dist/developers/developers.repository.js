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
exports.DevelopersRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const DEVELOPER_COLUMNS = 'id, name, slug, logo_url, description, phone, whatsapp, city';
// A first-class entity promoted from what was a plain `developer_name` text
// column on `projects` — confirmed real on the Zameen New Projects page's
// "Select Developers" search dropdown and "Featured Developers" section
// (logo, phone, WhatsApp, project count). Mirrors AgenciesRepository:
// public reads, super_admin-only writes.
let DevelopersRepository = class DevelopersRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async list(filters = {}) {
        let query = this.supabase.client.from('developers').select(DEVELOPER_COLUMNS).order('name', { ascending: true });
        if (filters.city)
            query = query.eq('city', filters.city);
        const { data, error } = await query;
        if (error)
            throw error;
        return data;
    }
    // Project count computed at query time — same "compute, never store"
    // discipline as AgenciesRepository.getStats().
    async findBySlug(slug) {
        const { data: developer, error } = await this.supabase.client
            .from('developers')
            .select(DEVELOPER_COLUMNS)
            .eq('slug', slug)
            .single();
        if (error)
            throw error;
        const { count, error: countError } = await this.supabase.client
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('developer_id', developer.id);
        if (countError)
            throw countError;
        return { ...developer, projectCount: count ?? 0 };
    }
    async create(input) {
        const { data, error } = await this.supabase.client
            .from('developers')
            .insert({
            name: input.name,
            slug: input.slug,
            logo_url: input.logoUrl,
            description: input.description,
            phone: input.phone,
            whatsapp: input.whatsapp,
            city: input.city,
        })
            .select(DEVELOPER_COLUMNS)
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, input) {
        const { data, error } = await this.supabase.client
            .from('developers')
            .update({
            name: input.name,
            logo_url: input.logoUrl,
            description: input.description,
            phone: input.phone,
            whatsapp: input.whatsapp,
            city: input.city,
        })
            .eq('id', id)
            .select(DEVELOPER_COLUMNS)
            .single();
        if (error)
            throw error;
        return data;
    }
    // Blocked by the FK from projects.developer_id if any project still
    // references this developer — a Postgres FK-violation error, not a
    // silent orphan (same discipline as SubscriptionTiersRepository.remove()).
    async remove(id) {
        const { error } = await this.supabase.client.from('developers').delete().eq('id', id);
        if (error)
            throw error;
        return { id };
    }
};
exports.DevelopersRepository = DevelopersRepository;
exports.DevelopersRepository = DevelopersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], DevelopersRepository);
