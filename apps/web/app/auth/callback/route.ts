import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Mirrors apps/web/app/(auth)/login/page.tsx's DEFAULT_LANDING_BY_ROLE
// (same duplication convention already used there and in
// verify-email/page.tsx). Needed here too because Google's OAuth round-trip
// leaves the app entirely before the user's role is known — a fresh Google
// sign-in with no explicit ?next= can only be routed once the session
// exists, i.e. after exchangeCodeForSession below. Password sign-in doesn't
// have this problem (role is already known synchronously after signIn
// resolves, same page), which is why this only lives here.
const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/admin/dashboard',
  verification_staff: '/verification',
  agent: '/dashboard',
  owner: '/submit',
  buyer: '/account/saved',
};

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
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) =>
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
        },
      },
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const role = data.user?.app_metadata?.role as string | undefined;
      const target = next || DEFAULT_LANDING_BY_ROLE[role ?? ''] || '/';
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
