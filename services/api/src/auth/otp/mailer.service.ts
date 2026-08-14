import { join } from 'path';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { paragraph, renderCodeBox, renderEmailHtml } from './email-template';
import { CODE_TTL_MS } from './otp-code.util';

// Derived from the actual enforced TTL, not a second hardcoded "10 minutes"
// string — otp-code.util.ts's CODE_TTL_MS is the one place that number is
// allowed to live, so bumping it (as already happened once, 10 -> 20) can't
// silently leave this copy telling users the wrong window again.
const CODE_TTL_MINUTES = CODE_TTL_MS / 60_000;

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
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = process.env.SMTP_SECURE === 'true';

    if (!host || !user || !password) {
      this.logger.error(
        `SMTP not configured — host=${host ?? 'unset'} user=${user ?? 'unset'} password=${password ? 'set' : 'unset'}`,
      );
      // A typed HTTP exception (not a bare Error) so callers surface a
      // diagnosable 503 instead of an opaque unhandled 500 — the actual
      // fix is still external (real SMTP credentials in .env), this just
      // stops it from looking like a random server crash.
      throw new ServiceUnavailableException(
        'Email delivery is not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD missing) — set these in services/api/.env.',
      );
    }

    // DEBUG — temporary, requested to diagnose an OTP not arriving. Never
    // logs the password itself, only enough to confirm which account/host
    // an attempt is actually using (a stale process still running with the
    // OLD SMTP_USER after an .env edit is a common cause of "I changed the
    // config but nothing changed").
    this.logger.log(`Creating SMTP transporter — host=${host} port=${port} secure=${secure} user=${user}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: password },
    });
    return this.transporter;
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    const html = renderEmailHtml({
      preheader: `Your verification code is ${code}`,
      heading: 'Verify your email',
      bodyHtml: paragraph('Enter this code to verify your email address and finish setting up your Jayedaad account.') + renderCodeBox(code) + paragraph(`This code expires in ${CODE_TTL_MINUTES} minutes.`),
      bodyText: '',
    });
    await this.send({
      to,
      subject: 'Your Jayedaad verification code',
      text: `Your verification code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
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
        paragraph(`This code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can safely ignore this email — your password won't be changed.`),
      bodyText: '',
    });
    await this.send({
      to,
      subject: 'Your Jayedaad password reset code',
      text: `Your password reset code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.`,
      html,
    });
  }

  // Saved-search alert email — the email counterpart to the in-app
  // 'new_match' notification saved-search-alerts.service.ts's hourly cron
  // already creates. Same cadence gating as that notification (this is
  // called from the same code path, right after it).
  async sendSavedSearchAlertEmail(
    to: string,
    { searchName, matchCount, topListingTitle, listingUrl }: { searchName: string | null; matchCount: number; topListingTitle: string; listingUrl: string },
  ): Promise<void> {
    const heading = searchName ? `New matches for "${searchName}"` : 'New matching listings';
    const summary =
      matchCount === 1 ? `1 new listing matches your saved search.` : `${matchCount} new listings match your saved search.`;
    const html = renderEmailHtml({
      preheader: summary,
      heading,
      bodyHtml:
        paragraph(summary) +
        paragraph(`Top match: <strong>${topListingTitle}</strong>`) +
        `<p style="text-align:center;margin:24px 0;"><a href="${listingUrl}" style="display:inline-block;padding:12px 24px;background:#0f766e;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600;">View Listing</a></p>`,
      bodyText: '',
    });
    await this.send({
      to,
      subject: heading,
      text: `${summary} Top match: ${topListingTitle}. View it here: ${listingUrl}`,
      html,
    });
  }

  // Shared send path so both OTP and password-reset emails get the same
  // diagnosable-error treatment — a bad password/host or provider outage
  // throws a raw nodemailer error from sendMail() itself (distinct from
  // getTransporter()'s missing-config check above), which would otherwise
  // still surface as an opaque 500.
  private async send(message: { to: string; subject: string; text: string; html: string }): Promise<void> {
    const from = process.env.SMTP_FROM_EMAIL ?? 'no-reply@jayedaad.com';
    // DEBUG — temporary, requested to diagnose an OTP not arriving.
    this.logger.log(`Attempting to send "${message.subject}" from ${from} to ${message.to}`);
    try {
      const info = await this.getTransporter().sendMail({
        from,
        ...message,
        attachments: [{ filename: 'jayedaad-logo.png', path: LOGO_PATH, cid: LOGO_CID }],
      });
      // DEBUG — the real signal to look for: messageId means the SMTP
      // server ACCEPTED the message for delivery, not that it landed in the
      // inbox (still subject to spam filtering/greylisting/etc. downstream
      // of this point, which nothing on our side can observe). `rejected`
      // being non-empty means the server accepted the connection but bounced
      // this specific recipient — a real, actionable signal if it happens.
      this.logger.log(
        `SMTP accepted message ${info.messageId} — accepted=[${(info.accepted ?? []).join(', ')}] rejected=[${(info.rejected ?? []).join(', ')}]`,
      );
    } catch (err) {
      // Full error, not just .message — nodemailer errors often carry a
      // `code` (e.g. EAUTH for bad credentials, ECONNECTION for a
      // host/port/firewall problem) that .message alone doesn't always spell out.
      this.logger.error(`SMTP send failed for ${message.to}`, err instanceof Error ? err.stack : String(err));
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException(
        `Failed to send email via SMTP: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }
}
