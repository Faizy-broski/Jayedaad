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
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const otp_repository_1 = require("./otp.repository");
const mailer_service_1 = require("./mailer.service");
const otp_code_util_1 = require("./otp-code.util");
let OtpService = class OtpService {
    repo;
    mailer;
    constructor(repo, mailer) {
        this.repo = repo;
        this.mailer = mailer;
    }
    async sendCode(userId) {
        const alreadyVerified = await this.repo.getEmailVerified(userId);
        if (alreadyVerified) {
            throw new common_1.BadRequestException('Email already verified');
        }
        const email = await this.repo.getEmail(userId);
        const code = (0, otp_code_util_1.generateCode)();
        const expiresAt = new Date(Date.now() + otp_code_util_1.CODE_TTL_MS);
        await this.repo.insertCode(userId, (0, otp_code_util_1.hashCode)(code), expiresAt, 'email_verification');
        await this.mailer.sendOtpEmail(email, code);
        return { sent: true };
    }
    async verifyCode(userId, code) {
        const row = await this.repo.findLatestActive(userId, 'email_verification');
        (0, otp_code_util_1.assertCodeUsable)(row);
        // Increment before checking so a mid-request crash still counts the attempt.
        await this.repo.incrementAttempt(row.id);
        (0, otp_code_util_1.assertHashMatches)(row, code);
        await this.repo.markConsumed(row.id);
        await this.repo.markEmailVerified(userId);
        return { verified: true };
    }
    async getStatus(userId) {
        const emailVerified = await this.repo.getEmailVerified(userId);
        return { emailVerified };
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [otp_repository_1.OtpRepository,
        mailer_service_1.MailerService])
], OtpService);
