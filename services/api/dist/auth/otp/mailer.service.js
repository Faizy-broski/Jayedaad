"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = __importDefault(require("nodemailer"));
// Custom OTP email delivery — NOT Supabase's built-in email. Unlike
// SupabaseService (required for the whole app to function), SMTP is only
// needed by this one feature — validated lazily on first send, not at
// construction, so the API still boots for developers not touching OTP yet.
let MailerService = class MailerService {
    transporter = null;
    getTransporter() {
        if (this.transporter)
            return this.transporter;
        const host = process.env.SMTP_HOST;
        const user = process.env.SMTP_USER;
        const password = process.env.SMTP_PASSWORD;
        if (!host || !user || !password) {
            throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be set to send OTP emails');
        }
        this.transporter = nodemailer_1.default.createTransport({
            host,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user, pass: password },
        });
        return this.transporter;
    }
    async sendOtpEmail(to, code) {
        await this.getTransporter().sendMail({
            from: process.env.SMTP_FROM_EMAIL ?? 'no-reply@jayedaad.com',
            to,
            subject: 'Your Jayedaad verification code',
            text: `Your verification code is ${code}. It expires in 10 minutes.`,
            html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
        });
    }
    async sendPasswordResetEmail(to, code) {
        await this.getTransporter().sendMail({
            from: process.env.SMTP_FROM_EMAIL ?? 'no-reply@jayedaad.com',
            to,
            subject: 'Your Jayedaad password reset code',
            text: `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
            html: `<p>Your password reset code is <strong>${code}</strong>. It expires in 10 minutes.</p><p>If you didn't request this, you can ignore this email.</p>`,
        });
    }
};
exports.MailerService = MailerService;
exports.MailerService = MailerService = __decorate([
    (0, common_1.Injectable)()
], MailerService);
