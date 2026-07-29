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
exports.AccountRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
// Self-service counterpart to users.repository.ts (super_admin-only) and
// agents.repository.ts::updateProfile (agent-only) — the plain-profiles
// read/write and account-deletion path every role can use on themselves.
let AccountRepository = class AccountRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async updateProfile(userId, input) {
        const { data, error } = await this.supabase.client
            .from('profiles')
            .update({
            display_name: input.displayName,
            phone: input.phone,
        })
            .eq('id', userId)
            .select('display_name, phone')
            .single();
        if (error)
            throw error;
        return { displayName: data.display_name, phone: data.phone };
    }
    // listings.owner_id/agent_id and leads.agent_id/lead_assignments.agent_id
    // reference auth.users/agent_profiles with NO cascade [0001 migration] —
    // deleting an account with any listing/lead history hits a raw Postgres
    // FK violation. Caught here and surfaced as a friendly 409 instead of a
    // raw 500, rather than silently succeeding or crashing.
    async deleteAccount(userId) {
        const { error } = await this.supabase.client.auth.admin.deleteUser(userId);
        if (error) {
            if (/foreign key/i.test(error.message)) {
                throw new common_1.ConflictException('You have active listings or leads tied to your account — remove or transfer them before deleting your account.');
            }
            throw error;
        }
    }
};
exports.AccountRepository = AccountRepository;
exports.AccountRepository = AccountRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AccountRepository);
