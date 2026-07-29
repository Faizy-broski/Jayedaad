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
exports.PasswordResetService = void 0;
const common_1 = require("@nestjs/common");
const otp_repository_1 = require("../otp/otp.repository");
const mailer_service_1 = require("../otp/mailer.service");
const otp_code_util_1 = require("../otp/otp-code.util");
const supabase_service_1 = require("../../supabase/supabase.service");
let PasswordResetService = class PasswordResetService {
    repo;
    mailer;
    supabase;
    constructor(repo, mailer, supabase) {
        this.repo = repo;
        this.mailer = mailer;
        this.supabase = supabase;
    }
    async requestReset(email) {
        const userId = await this.repo.findUserIdByEmail(email);
        // Always the same response whether or not the email matched an account —
        // this endpoint is unauthenticated by nature, so confirming/denying
        // account existence here would be a user-enumeration vector.
        if (userId) {
            const code = (0, otp_code_util_1.generateCode)();
            const expiresAt = new Date(Date.now() + otp_code_util_1.CODE_TTL_MS);
            await this.repo.insertCode(userId, (0, otp_code_util_1.hashCode)(code), expiresAt, 'password_reset');
            await this.mailer.sendPasswordResetEmail(email, code);
        }
        return { sent: true };
    }
    async confirmReset(email, code, newPassword) {
        const userId = await this.repo.findUserIdByEmail(email);
        if (!userId) {
            // Same generic error as an invalid code — don't distinguish "no such
            // account" from "wrong code" for the same anti-enumeration reason.
            throw new common_1.BadRequestException('Incorrect code');
        }
        const row = await this.repo.findLatestActive(userId, 'password_reset');
        (0, otp_code_util_1.assertCodeUsable)(row);
        await this.repo.incrementAttempt(row.id);
        (0, otp_code_util_1.assertHashMatches)(row, code);
        await this.repo.markConsumed(row.id);
        // Only callable server-side with the service-role key — this is the
        // entire reason this flow needs a backend endpoint rather than anything
        // client-side; there is no Supabase reset-link email involved at all.
        const { error } = await this.supabase.client.auth.admin.updateUserById(userId, { password: newPassword });
        if (error)
            throw error;
        return { reset: true };
    }
};
exports.PasswordResetService = PasswordResetService;
exports.PasswordResetService = PasswordResetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [otp_repository_1.OtpRepository,
        mailer_service_1.MailerService,
        supabase_service_1.SupabaseService])
], PasswordResetService);
