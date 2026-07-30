import { join } from 'path';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { paragraph, renderCodeBox, renderEmailHtml } from './email-template';

// Embedded as a CID inline attachment (not an external image URL) — works
// regardless of whether/where apps/web ends up deployed, and won't break if
// that domain changes later. Copied from apps/web/public/images/ rather than
// referenced across app boundaries — services/api is deployed separately
// and shouldn't runtime-depend on apps/web's file layout. `nest-cli.json`'s
// `assets` entry copies this into dist/ alongside the compiled JS on build.
const LOGO_PATH = join(__dirname, 'assets', 'jayedaad-logo.png');
const LOGO_CID = 'jayedaad-logo';

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
    const html = renderEmailHtml({
      preheader: `Your verification code is ${code}`,
      heading: 'Verify your email',
      bodyHtml: paragraph('Enter this code to verify your email address and finish setting up your Jayedaad account.') + renderCodeBox(code) + paragraph('This code expires in 10 minutes.'),
      bodyText: '',
    });
    await this.send({
      to,
      subject: 'Your Jayedaad verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const html = renderEmailHtml({
      preheader: `Your password reset code is ${code}`,
      heading: 'Reset your password',
      bodyHtml:
        paragraph('Use this code to reset your Jayedaad password.') +
        renderCodeBox(code) +
        paragraph("This code expires in 10 minutes. If you didn't request this, you can safely ignore this email — your password won't be changed."),
      bodyText: '',
    });
    await this.send({
      to,
      subject: 'Your Jayedaad password reset code',
      text: `Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      html,
    });
  }

  // Shared send path so both OTP and password-reset emails get the same
  // diagnosable-error treatment — a bad password/host or provider outage
  // throws a raw nodemailer error from sendMail() itself (distinct from
  // getTransporter()'s missing-config check above), which would otherwise
  // still surface as an opaque 500.
  private async send(message: { to: string; subject: string; text: string; html: string }): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: process.env.SMTP_FROM_EMAIL ?? 'no-reply@jayedaad.com',
        ...message,
        attachments: [{ filename: 'jayedaad-logo.png', path: LOGO_PATH, cid: LOGO_CID }],
      });
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException(
        `Failed to send email via SMTP: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }
}
