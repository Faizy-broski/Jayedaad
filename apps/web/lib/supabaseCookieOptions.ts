// Session cookies were host-only (no `domain` set anywhere), while nginx
// serves both jayedaad.pk and www.jayedaad.pk identically with no
// canonicalizing redirect between them — a user who signs in on one host
// gets a cookie the other host never sees, and the very next protected
// navigation bounces them back to /login (confirmed real production bug).
//
// Deriving the domain via `new URL(...).hostname` (never string-slicing)
// and only matching the exact production hostnames means anything else —
// most importantly `localhost` in local dev — falls through to `undefined`
// (today's host-only behavior), so this can never accidentally break local
// dev even if NEXT_PUBLIC_SITE_URL is misconfigured.
const SHARED_COOKIE_HOSTS = new Set(['jayedaad.pk', 'www.jayedaad.pk']);

export function getSupabaseCookieDomain(): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return undefined;
  try {
    const hostname = new URL(siteUrl).hostname;
    return SHARED_COOKIE_HOSTS.has(hostname) ? '.jayedaad.pk' : undefined;
  } catch {
    return undefined;
  }
}

export function getSupabaseCookieOptions(): { domain?: string } {
  return { domain: getSupabaseCookieDomain() };
}
