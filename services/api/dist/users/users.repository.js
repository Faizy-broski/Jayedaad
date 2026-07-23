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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
// Full account lifecycle for Super Admin [Reqs §9]: "Create, edit, suspend,
// and delete any user account, including Verification Staff and Agent
// accounts." Uses the Supabase Admin API (service-role client, already
// wired via SupabaseService) — identity lives in Supabase Auth, this API
// never manages passwords/sessions directly, only orchestrates the Admin API.
let UsersRepository = class UsersRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async findById(id) {
        const { data, error } = await this.supabase.client.from('profiles').select('*').eq('id', id).maybeSingle();
        if (error)
            throw error;
        return data;
    }
    // Backs the Super Admin "team members" screen — `roles` filters to just
    // internal staff (e.g. ?role=super_admin,verification_staff) instead of
    // the full user base (buyers/owners/agents included).
    async list(filters = {}) {
        let query = this.supabase.client.from('profiles').select('*').order('created_at', { ascending: false });
        if (filters.roles?.length)
            query = query.in('role', filters.roles);
        const { data, error } = await query;
        if (error)
            throw error;
        return data;
    }
    // role/agent_id land in app_metadata at creation time — the same
    // tamper-proof claim JwtAuthGuard already reads, set only via this
    // service-role-authenticated path, never by the user themselves.
    // display_name is now included for every role (previously only threaded
    // through to agent_profiles in the agent branch below) — the
    // handle_new_user() trigger [0002 migration] copies it into
    // profiles.display_name/profiles.email so team member accounts have a
    // human-readable name, not just an opaque UUID + role.
    async create(input) {
        const { data: created, error: createError } = await this.supabase.client.auth.admin.createUser({
            email: input.email,
            password: input.password,
            email_confirm: true,
            app_metadata: { role: input.role, display_name: input.displayName },
        });
        if (createError)
            throw createError;
        const userId = created.user.id;
        if (input.role === 'agent') {
            const { data: agentProfile, error: agentError } = await this.supabase.client
                .from('agent_profiles')
                .insert({ user_id: userId, display_name: input.displayName, agency_id: input.agencyId })
                .select('id')
                .single();
            if (agentError)
                throw agentError;
            const { error: backfillError } = await this.supabase.client.auth.admin.updateUserById(userId, {
                app_metadata: { role: 'agent', agent_id: agentProfile.id, display_name: input.displayName },
            });
            if (backfillError)
                throw backfillError;
        }
        return this.findById(userId);
    }
    // Merges into existing app_metadata (preserving agent_id if present)
    // rather than overwriting it outright, and keeps profiles.role in sync
    // for SQL-side joins/consistency.
    async updateRole(id, input) {
        const { data: existing, error: getError } = await this.supabase.client.auth.admin.getUserById(id);
        if (getError)
            throw getError;
        const { error: updateError } = await this.supabase.client.auth.admin.updateUserById(id, {
            app_metadata: { ...existing.user.app_metadata, role: input.role },
        });
        if (updateError)
            throw updateError;
        const { error: profileError } = await this.supabase.client
            .from('profiles')
            .update({ role: input.role })
            .eq('id', id);
        if (profileError)
            throw profileError;
        return this.findById(id);
    }
    // ~100 years is Supabase's own documented convention for an effectively
    // permanent ban via ban_duration (there's no literal "forever" value).
    async suspend(id) {
        const { error } = await this.supabase.client.auth.admin.updateUserById(id, { ban_duration: '876000h' });
        if (error)
            throw error;
    }
    async unsuspend(id) {
        const { error } = await this.supabase.client.auth.admin.updateUserById(id, { ban_duration: 'none' });
        if (error)
            throw error;
    }
    // agent_profiles.user_id has ON DELETE CASCADE [0006 migration] — deleting
    // the auth user automatically cleans up their agent profile, subscription,
    // credits, etc.
    async remove(id) {
        const { error } = await this.supabase.client.auth.admin.deleteUser(id);
        if (error)
            throw error;
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UsersRepository);
