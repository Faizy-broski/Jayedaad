import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

// Custom OTP email delivery — NOT Supabase's built-in email. Unlike
// SupabaseService (required for the whole app to function), SMTP is only
// needed by this one feature — validated lazily on first send, not at
// construction, so the API still boots for developers not touching OTP yet.
@Injectable()
export class MailerService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;

    if (!host || !user || !password) {
      throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be set to send OTP emails');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass: password },
    });
    return this.transporter;
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    await this.getTransporter().sendMail({
      from: process.env.SMTP_FROM_EMAIL ?? 'no-reply@jayedaad.com',
      to,
      subject: 'Your Jayedaad verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    await this.getTransporter().sendMail({
      from: process.env.SMTP_FROM_EMAIL ?? 'no-reply@jayedaad.com',
      to,
      subject: 'Your Jayedaad password reset code',
      text: `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      html: `<p>Your password reset code is <strong>${code}</strong>. It expires in 10 minutes.</p><p>If you didn't request this, you can ignore this email.</p>`,
    });
  }
}
