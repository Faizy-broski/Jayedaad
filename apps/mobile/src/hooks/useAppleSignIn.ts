import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthViewModel } from '@jayedaad/core';

// Mirrors useGoogleSignIn.ts exactly — routes entirely through Supabase's
// signInWithOAuth (real Apple OAuth), no native expo-apple-authentication
// SDK. Expo's in-app browser drives the redirect since there's no
// window.location in React Native (see getAppleOAuthUrl's
// skipBrowserRedirect in authService.ts).
export function useAppleSignIn() {
  const { getAppleOAuthUrl, exchangeCodeForSession } = useAuthViewModel();

  // Returns whether a session was actually established, so callers can tell
  // a genuine success apart from the user cancelling/dismissing the sheet
  // (openAuthSessionAsync resolves normally either way) apart from a real
  // failure (Supabase returning ?error=/&error_description= on the
  // redirect, or no `code` param at all) — see useGoogleSignIn.ts's
  // matching comment for why this used to fall silently to
  // { success: false } with nothing shown to the user (App.tsx's
  // flowType: 'pkce' fixes the root cause; this still adds the missing
  // error surfacing for any other failure mode on this same code path).
  async function signInWithApple(): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
    const redirectTo = Linking.createURL('auth/callback');
    const url = await getAppleOAuthUrl.mutateAsync(redirectTo);
    const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);

    if (result.type !== 'success' || !result.url) {
      return { success: false, cancelled: true };
    }

    const { queryParams } = Linking.parse(result.url);
    const code = queryParams?.code as string | undefined;
    if (code) {
      await exchangeCodeForSession.mutateAsync(code);
      return { success: true };
    }

    const error = (queryParams?.error_description as string | undefined) ?? (queryParams?.error as string | undefined);
    return { success: false, error: error || 'Apple sign-in failed — please try again.' };
  }

  return { signInWithApple, isPending: getAppleOAuthUrl.isPending || exchangeCodeForSession.isPending };
}
