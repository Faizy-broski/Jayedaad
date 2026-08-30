'use client';

import { useAuthViewModel } from '@jayedaad/core';

// Shared by every dashboard shell's logout button ((agent)/(account)/
// (verification)/(super-admin) layouts) — previously each layout duplicated
// `signOut.mutate(undefined, { onSuccess: ... })` with no `onError`, so a
// signOut() API failure (authService.signOut() re-throws on error — see
// packages/core) left the mutation in an error state and the redirect to
// /login never fired: "logout does nothing." A failed sign-out attempt on an
// already-broken session should still land the user on /login, same as
// providers.tsx's onUnauthorized handler already does via .finally().
//
// window.location.href (not router.push) — same reasoning as the post-login
// redirect in (auth)/login/page.tsx: a hard navigation guarantees the next
// page load starts from a clean Supabase client instance with no leftover
// background refresh timer/in-flight promise from the session just ended.
export function useLogout() {
  const { signOut } = useAuthViewModel();

  function logout() {
    signOut.mutate(undefined, {
      onSuccess: () => {
        window.location.href = '/login';
      },
      onError: () => {
        window.location.href = '/login';
      },
    });
  }

  return { logout, isPending: signOut.isPending };
}
