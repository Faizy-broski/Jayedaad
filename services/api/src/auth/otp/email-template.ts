// Shared HTML wrapper for every transactional email this service sends
// (OTP verification, password reset) — inline CSS only, since email clients
// don't load external stylesheets. Colors match apps/web/app/globals.css's
// documented brand hex values (--primary #07533E, --brand-dark #011B14),
// not a separate palette invented for email.
export interface EmailContent {
  preheader: string; // short hidden summary shown in inbox previews (Gmail/Outlook)
  heading: string;
  bodyHtml: string; // inner content, inserted as-is inside the card
  bodyText: string; // plain-text equivalent for the text/plain part
}

const COLORS = {
  pageBg: '#F3F4F6',
  cardBg: '#FFFFFF',
  primary: '#07533E',
  brandDark: '#011B14',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  codeBg: '#F0FDF9',
};

export function renderEmailHtml({ preheader, heading, bodyHtml }: EmailContent): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${COLORS.pageBg}; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!-- Preheader: hidden, only shows as the inbox preview snippet -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.pageBg}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:${COLORS.cardBg}; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(1,27,20,0.08);">
            <tr>
              <td align="center" style="background-color:${COLORS.brandDark}; padding:28px 24px;">
                <img src="cid:jayedaad-logo" alt="Jayedaad" width="140" style="display:block; height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0; font-size:20px; line-height:1.3; color:${COLORS.text}; font-weight:700;">${heading}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:${COLORS.muted};">
                  This is an automated message from Jayedaad — Building Trust in Real Estate. If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0 0; font-size:12px; color:${COLORS.muted};">&copy; ${new Date().getFullYear()} Jayedaad. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

// The 6-digit code, rendered large/bold/letter-spaced in a highlighted box —
// the one piece of content the recipient actually needs to find at a glance.
export function renderCodeBox(code: string): string {
  return `
<div style="margin:20px 0; padding:20px; background-color:${COLORS.codeBg}; border:1px solid ${COLORS.border}; border-radius:12px; text-align:center;">
  <span style="font-size:32px; font-weight:700; letter-spacing:8px; color:${COLORS.primary}; font-family:'Courier New', monospace;">${code}</span>
</div>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:${COLORS.muted};">${text}</p>`;
}
