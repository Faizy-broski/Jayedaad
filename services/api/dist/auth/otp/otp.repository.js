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
exports.OtpRepository = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let OtpRepository = class OtpRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async insertCode(userId, codeHash, expiresAt, purpose) {
        const { error } = await this.supabase.client.from('email_otp_codes').insert({
            user_id: userId,
            code_hash: codeHash,
            expires_at: expiresAt.toISOString(),
            purpose,
        });
        if (error)
            throw error;
    }
    async findLatestActive(userId, purpose) {
        const { data, error } = await this.supabase.client
            .from('email_otp_codes')
            .select('id, code_hash, expires_at, attempt_count, max_attempts')
            .eq('user_id', userId)
            .eq('purpose', purpose)
            .is('consumed_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async incrementAttempt(id) {
        const { error } = await this.supabase.client.rpc('increment_email_otp_attempt', { p_id: id });
        if (error)
            throw error;
    }
    async markConsumed(id) {
        const { error } = await this.supabase.client
            .from('email_otp_codes')
            .update({ consumed_at: new Date().toISOString() })
            .eq('id', id);
        if (error)
            throw error;
    }
    async getEmailVerified(userId) {
        const { data, error } = await this.supabase.client
            .from('profiles')
            .select('email_verified')
            .eq('id', userId)
            .single();
        if (error)
            throw error;
        return data.email_verified;
    }
    async getEmail(userId) {
        const { data, error } = await this.supabase.client.from('profiles').select('email').eq('id', userId).single();
        if (error)
            throw error;
        return data.email;
    }
    async markEmailVerified(userId) {
        const { error } = await this.supabase.client.from('profiles').update({ email_verified: true }).eq('id', userId);
        if (error)
            throw error;
    }
    // Password reset starts from an email, not a session — profiles.email is
    // an unguarded column (no admin API needed for this lookup, unlike the
    // actual password change later, which does require it).
    async findUserIdByEmail(email) {
        const { data, error } = await this.supabase.client
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        if (error)
            throw error;
        return data?.id ?? null;
    }
};
exports.OtpRepository = OtpRepository;
exports.OtpRepository = OtpRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], OtpRepository);
