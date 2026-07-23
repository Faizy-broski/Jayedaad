import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Route-group access control — role gates for the (admin)/(agent)/(owner)
// route groups (see app/(admin)/verification, app/(agent)/crm,
// app/(owner)/submit). Route GROUPS don't appear in the actual URL (only
// their child segment does), so these are real URL path prefixes, not the
// `(admin)` folder name. Mirrors the same role set already enforced
// server-side by services/api's @Roles() decorators — this is defense in
// depth (a nicer redirect than a raw 403 from the API), not the source of
// truth; the API still enforces this regardless of what the client does.
const PROTECTED_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: '/verification', roles: ['super_admin', 'verification_staff'] },
  { prefix: '/crm', roles: ['agent', 'super_admin'] },
  { prefix: '/submit', roles: ['owner', 'agent', 'super_admin'] },
];

export async function middleware(request: NextRequest) {
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
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.app_metadata?.role as string | undefined;
  if (!role || !match.roles.includes(role)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/verification/:path*', '/crm/:path*', '/submit/:path*'],
};
