import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseCookieOptions } from './lib/supabaseCookieOptions';

// Route-group access control — role gates for the (verification)/(agent)/
// (owner) route groups (see app/(verification)/verification, app/(agent)/crm,
// app/(owner)/submit). Route GROUPS don't appear in the actual URL (only
// their child segment does), so these are real URL path prefixes, not the
// `(verification)` folder name. Mirrors the same role set already enforced
// server-side by services/api's @Roles() decorators — this is defense in
// depth (a nicer redirect than a raw 403 from the API), not the source of
// truth; the API still enforces this regardless of what the client does.
const PROTECTED_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: '/verification', roles: ['super_admin', 'verification_staff'] },
  { prefix: '/crm', roles: ['agent', 'super_admin'] },
  // Opportunity pipeline / Kanban board (Phase 3 of the CRM maturity
  // build-out) — same role gate as /crm.
  { prefix: '/pipeline', roles: ['agent', 'super_admin'] },
  // 'buyer' is allowed here because the page itself auto-promotes a fresh
  // buyer to 'agent' on mount — see apps/web/app/(agent)/submit/page.tsx's
  // isPromotingOwner effect ('owner' role is retired, see
  // supabase/migrations/0056_retire_owner_role.sql — that effect now lands
  // on 'agent' too). Blocking buyers here would prevent them from ever
  // reaching that promotion in the first place.
  { prefix: '/submit', roles: ['buyer', 'agent', 'super_admin'] },
  { prefix: '/calendar', roles: ['agent', 'super_admin'] },
  { prefix: '/revenue', roles: ['agent', 'super_admin'] },
  // Rest of the (agent) Profolio-style portal — see app/(agent)/layout.tsx.
  { prefix: '/dashboard', roles: ['agent', 'super_admin'] },
  { prefix: '/property-management', roles: ['agent', 'super_admin'] },
  { prefix: '/projects', roles: ['agent', 'super_admin'] },
  { prefix: '/agent-settings', roles: ['agent', 'super_admin'] },
  { prefix: '/plan', roles: ['agent', 'super_admin'] },
  // Listing detail is the one /admin/* screen verification_staff also needs
  // — the verification queue's "View full listing" link opens it for
  // extra context on a pending listing. Declared BEFORE the generic /admin
  // rule below since PROTECTED_ROUTES.find() takes the first matching
  // prefix — otherwise the broader '/admin' entry would win first and
  // block verification_staff here too.
  { prefix: '/admin/listings', roles: ['super_admin', 'verification_staff'] },
  // Super Admin "god mode" dashboard — see app/(super-admin)/layout.tsx.
  // Deliberately super_admin-only for everything else under /admin (not
  // shared with verification_staff, unlike /verification above).
  { prefix: '/admin', roles: ['super_admin'] },
  // Self-service "Apply to become an agent" — buyer-only; an agent visiting
  // after their application is approved is redirected away by role change
  // (role flips to 'agent' server-side, no longer matches this gate).
  { prefix: '/become-an-agent', roles: ['buyer', 'agent'] },
  // Staff review queue for self-service agent applications — same access
  // pattern as /verification above (shared with verification_staff).
  { prefix: '/agent-verification', roles: ['super_admin', 'verification_staff'] },
  // Staff review queue for owner identity verification — same pattern as
  // /agent-verification above.
  { prefix: '/owner-verification', roles: ['super_admin', 'verification_staff'] },
  // Agency self-management — role-gated here to 'agent'/'super_admin' same
  // as the rest of the (agent) portal; the isAgencyAdmin=true check happens
  // server-side per-request (agencies.controller.ts::assertCanManageStaff),
  // this is just the outer role gate.
  { prefix: '/agency-staff', roles: ['agent', 'super_admin'] },
  // Buyer account area (Favorites & Saved Searches, notifications) — any
  // authenticated role can favorite/save a search, not just buyers, so this
  // stays as broad as /submit's role list above.
  { prefix: '/account', roles: ['buyer', 'agent', 'super_admin'] },
];

// Next's `output: 'standalone'` server (required for the Docker deploy)
// always builds request.url's origin from its own bind address
// (HOSTNAME=0.0.0.0, needed to listen on all interfaces) — never from the
// real Host header, even behind a correctly configured reverse proxy. So
// `new URL(path, request.url)` below would silently redirect to
// "http://0.0.0.0:3000/..." in production; NEXT_PUBLIC_SITE_URL is the real
// public origin instead (wired through Docker/CI same as the other
// NEXT_PUBLIC_* vars), used as the base for every absolute redirect here.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function middleware(request: NextRequest) {
  // Was a separate app/(account)/page.tsx doing a plain server-side
  // redirect() with no JSX — under (account)/layout.tsx's 'use client'
  // boundary, that combination made Vercel's build trace fail looking for a
  // page_client-reference-manifest.js that never got generated for a
  // manifest-less redirect-only page. Handling the redirect here instead
  // avoids that file existing at all. Re-enters this same middleware on the
  // redirected URL, so auth/role gating below still applies normally.
  if (request.nextUrl.pathname === '/account') {
    return NextResponse.redirect(new URL('/account/saved', SITE_URL));
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const match = PROTECTED_ROUTES.find((route) => request.nextUrl.pathname.startsWith(route.prefix));
  if (!match) return response;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Not configured (e.g. a fresh checkout before .env is filled in) — don't
  // block local dev on a missing env var; services/api still enforces auth
  // regardless of what happens here.
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getSupabaseCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() (not getSession()) — revalidates the token against Supabase
  // rather than trusting an unverified cookie, the documented-safe way to
  // check auth in middleware.
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (!user) {
    // A confirmed "no session" and a transient Supabase Auth failure both
    // land here today with no way to tell them apart from logs — log the
    // error (if any) so a repeat of a real production incident is
    // diagnosable without re-deriving this from scratch.
    if (getUserError) {
      console.warn(`[middleware] supabase.auth.getUser() failed for ${request.nextUrl.pathname}: ${getUserError.message}`);
    }
    const loginUrl = new URL('/login', SITE_URL);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.app_metadata?.role as string | undefined;
  if (!role || !match.roles.includes(role)) {
    return NextResponse.redirect(new URL('/', SITE_URL));
  }

  return response;
}

export const config = {
  matcher: [
    '/verification/:path*',
    '/crm/:path*',
    '/pipeline/:path*',
    '/submit/:path*',
    '/dashboard/:path*',
    '/property-management/:path*',
    '/projects/:path*',
    '/agent-settings/:path*',
    '/revenue/:path*',
    '/plan/:path*',
    '/admin/:path*',
    '/become-an-agent/:path*',
    '/agent-verification/:path*',
    '/owner-verification/:path*',
    '/agency-staff/:path*',
    '/account/:path*',
  ],
};
