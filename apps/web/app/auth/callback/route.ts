import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseCookieOptions } from '@/lib/supabaseCookieOptions';

// Only accept a same-app internal path as `next` — rejects a
// protocol-relative '//host' (browsers treat that as an off-site redirect)
// or anything not starting with a single '/'. `next` previously flowed
// straight into the redirect with no check at all; safe in practice only
// because its one existing caller (login/page.tsx) always sources it from
// nextUrl.pathname, not because this route enforced anything — worth
// closing properly now that signup/page.tsx is becoming a second caller.
function isSafeNext(value: string | null): value is string {
  return !!value && value.startsWith('/') && !value.startsWith('//');
}

// Deliberately NOT imported from @jayedaad/core's resolveDefaultLandingRoute
// (packages/core/src/constants/landingRoutes.ts), even though every other
// call site uses it — a route.ts handler has no 'use client' escape hatch,
// and importing anything from that package's barrel (src/index.ts) pulls in
// its entire transitive export graph, including client-only hooks like
// useChatbotViewModel's useState. That broke the production build
// ("needs useState... none of its parents are marked with 'use client'").
// middleware.ts already avoids importing @jayedaad/core for the same
// reason (see its own local isRefreshTokenAlreadyUsedError helper) — this
// mirrors that, same duplication convention the original code here already
// used before consolidation, kept local specifically for this one file.
const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/admin/dashboard',
  verification_staff: '/verification',
  agent: '/dashboard',
  owner: '/submit',
  buyer: '/account/saved',
};

function resolveDefaultLandingRoute(role: string | undefined): string {
  return DEFAULT_LANDING_BY_ROLE[role ?? ''] || '/';
}

// PKCE code exchange after Google (or any future Supabase OAuth provider)
// redirects back here. Uses @supabase/ssr directly (not authService.ts) —
// same sanctioned exception as middleware.ts, since only @supabase/ssr can
// write the cookie-backed session apps/web relies on. handle_new_user()
// (supabase/migrations/0013_profiles_email_verified.sql) already sets
// profiles.email_verified = true for Google signups — no OTP step needed here.
export async function GET(request: NextRequest) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  // Next's `output: 'standalone'` server (required for the Docker deploy)
  // always builds request.url's origin from its own bind address
  // (HOSTNAME=0.0.0.0, needed to listen on all interfaces) — never from the
  // real Host header, even behind a correctly configured reverse proxy. So
  // request.url's origin is always e.g. "http://0.0.0.0:3000" in production
  // and can't be trusted here; NEXT_PUBLIC_SITE_URL is the real public
  // origin instead (wired through Docker/CI same as the other NEXT_PUBLIC_*
  // vars). requestOrigin is kept only as a last-resort fallback (local dev
  // without .env filled in yet).
  const origin = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const response = NextResponse.redirect(origin);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: getSupabaseCookieOptions(),
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) =>
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
        },
      },
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let role = data.user?.app_metadata?.role as string | undefined;
      // handle_new_user()'s trigger writes profiles.role and auth.users'
      // own app_metadata.role in the same transaction as the account
      // insert — but the JWT claims exchangeCodeForSession just returned
      // were built from the row as it existed when the exchange started,
      // which can be a moment before that write lands. A falsy role here
      // is exactly what that race looks like (verify-email/page.tsx's
      // password-signup path doesn't hit this because its verifyOtp
      // mutation already calls refreshSession() for the same reason) — one
      // refresh, no loop, before falling back to '/' for what would
      // otherwise look like a roleless account.
      if (!role) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        role = refreshed.user?.app_metadata?.role as string | undefined;
      }
      const target = (isSafeNext(next) ? next : null) || resolveDefaultLandingRoute(role);
      response.headers.set('location', `${origin}${target}`);
      return response;
    }
    // "User is banned" (AuthApiError code user_banned — confirmed
    // empirically against this project) is the same rejection
    // signInWithPassword returns for a suspended account; distinguished
    // here so login/page.tsx can show the real reason instead of a flat
    // "sign-in failed".
    if (/banned/i.test(error.message)) {
      return NextResponse.redirect(`${origin}/login?error=banned`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
