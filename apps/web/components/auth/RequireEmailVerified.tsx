'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthViewModel } from '@jayedaad/core';

// Re-checks the OTP email-verification gate on every visit to a protected
// shell, not just once at the moment of login submission — see
// app/(auth)/login/page.tsx's post-signIn `if (!emailVerified) router.push
// ('/verify-email')`. That check only ever fires from the login form
// itself; a signed-in-but-unverified session (page refresh, a bookmarked
// URL, clicking the Header's "Dashboard" link, an already-open tab from
// before verification) hits none of it and could freely use the whole
// portal, since middleware.ts only enforces auth+role, never
// email_verified (it isn't in the JWT — it's a `profiles` table column,
// fetched client-side via useAuthViewModel's isEmailVerified). Mounted in
// each protected layout so the redirect re-fires on every visit, mirroring
// mobile's AuthGateProvider. Same "redirect via effect, don't block
// rendering" approach as verify-email/page.tsx's own guard — the
// isEmailVerified round trip is a single cached (staleTime: Infinity)
// fetch, so this is a brief redirect, not a persistent blocker.
export function RequireEmailVerified({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isEmailVerified, isEmailVerifiedLoading, isEmailVerifiedError } = useAuthViewModel();

  useEffect(() => {
    // !isEmailVerifiedError matters — without it, a transient failure of
    // the underlying GET /auth/otp/status check (isEmailVerified collapsing
    // to false via `?? false` in useAuthViewModel) bounced an
    // already-verified agent to /verify-email on any brief backend hiccup,
    // re-firing on every navigation since this runs on every mount.
    if (isAuthenticated && !isEmailVerifiedLoading && !isEmailVerifiedError && !isEmailVerified) {
      router.replace('/verify-email');
    }
  }, [isAuthenticated, isEmailVerified, isEmailVerifiedLoading, isEmailVerifiedError, router]);

  return <>{children}</>;
}
