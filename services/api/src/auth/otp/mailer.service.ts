import { Injectable, ServiceUnavailableException } from '@nestjs/common';
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
      // A typed HTTP exception (not a bare Error) so callers surface a
      // diagnosable 503 instead of an opaque unhandled 500 — the actual
      // fix is still external (real SMTP credentials in .env), this just
      // stops it from looking like a random server crash.
      throw new ServiceUnavailableException(
        'Email delivery is not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD missing) — set these in services/api/.env.',
      );
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
    await this.send({
      to,
      subject: 'Your Jayedaad verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    await this.send({
      to,
      subject: 'Your Jayedaad password reset code',
      text: `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      html: `<p>Your password reset code is <strong>${code}</strong>. It expires in 10 minutes.</p><p>If you didn't request this, you can ignore this email.</p>`,
    });
  }

  // Shared send path so both OTP and password-reset emails get the same
  // diagnosable-error treatment — a bad password/host or provider outage
  // throws a raw nodemailer error from sendMail() itself (distinct from
  // getTransporter()'s missing-config check above), which would otherwise
  // still surface as an opaque 500.
  private async send(message: { to: string; subject: string; text: string; html: string }): Promise<void> {
    try {
      await this.getTransporter().sendMail({ from: process.env.SMTP_FROM_EMAIL ?? 'no-reply@jayedaad.com', ...message });
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException(
        `Failed to send email via SMTP: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }
}
