// Real Remember-Me: web's Supabase client (@supabase/ssr's createBrowserClient,
// configured once at app startup in providers.tsx) stores the session in
// cookies for middleware.ts to read. That client is a singleton with no
// per-sign-in persistence option, so "unchecked" is implemented by rewriting
// Supabase's own auth cookie(s) right after a successful sign-in, stripping
// Max-Age/Expires — browsers treat a cookie with neither as session-only
// (cleared when the browser fully closes). Checked (default) leaves
// Supabase's normal persistent cookie untouched — nothing to do.
export function makeSessionOnlyIfNotRemembered(rememberMe: boolean): void {
  if (rememberMe || typeof document === 'undefined') return;

  const cookieNames = document.cookie
    .split('; ')
    .map((entry) => entry.split('=')[0])
    .filter((name) => name.startsWith('sb-') && name.includes('-auth-token'));

  for (const name of cookieNames) {
    const entry = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
    const value = entry?.split('=').slice(1).join('=');
    if (value === undefined) continue;

    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${value}; path=/; SameSite=Lax${secure}`;
  }
}
