import type { User } from '@supabase/supabase-js';

// Every screen that greets/labels the signed-in user duplicated its own
// `user?.user_metadata?.display_name || user?.email || 'fallback'` ternary
// (web's Header/account/agent/super-admin layouts, the agent dashboard
// greeting, mobile's SideDrawer/HomeScreen/ProfileScreen) — and every one of
// them silently broke for Google/Apple sign-in. `display_name` is only ever
// set by our own email/password signUp() call (authService.ts); OAuth
// providers never populate it, they populate `full_name`/`name` instead (the
// claims Supabase copies from the provider's identity data). So any
// OAuth-signed-in user fell straight through every one of those chains to
// their raw email — this centralizes the real, complete fallback order so
// that regresses in exactly one place if a new provider/field shows up
// instead of N ad-hoc copies.
export function getDisplayName(user: Pick<User, 'user_metadata' | 'email'> | null | undefined, fallback = 'Guest'): string {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const name =
    (metadata?.display_name as string | undefined) ||
    (metadata?.full_name as string | undefined) ||
    (metadata?.name as string | undefined);
  return name || user?.email || fallback;
}
