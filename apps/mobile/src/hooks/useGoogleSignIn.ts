import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthViewModel } from '@jayedaad/core';

// Routes entirely through Supabase's signInWithOAuth — no native Google SDK.
// Expo's in-app browser drives the redirect since there's no window.location
// in React Native (see getGoogleOAuthUrl's skipBrowserRedirect in authService.ts).
export function useGoogleSignIn() {
  const { getGoogleOAuthUrl, exchangeCodeForSession } = useAuthViewModel();

  // Returns whether a session was actually established, so callers can tell
  // a genuine success apart from the user cancelling/dismissing the sheet
  // (openAuthSessionAsync resolves normally either way) apart from a real
  // failure (Supabase returning ?error=/&error_description= on the redirect,
  // or no `code` param at all) — previously all three cases fell through to
  // the same silent `{ success: false }` with nothing shown to the user.
  async function signInWithGoogle(): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
    const redirectTo = Linking.createURL('auth/callback');
    const url = await getGoogleOAuthUrl.mutateAsync(redirectTo);
    const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);

    if (result.type !== 'success' || !result.url) {
      // User dismissed/cancelled the browser sheet — not an error, nothing
      // to show.
      return { success: false, cancelled: true };
    }

    const { queryParams } = Linking.parse(result.url);
    const code = queryParams?.code as string | undefined;
    if (code) {
      await exchangeCodeForSession.mutateAsync(code);
      return { success: true };
    }

    const error = (queryParams?.error_description as string | undefined) ?? (queryParams?.error as string | undefined);
    return { success: false, error: error || 'Google sign-in failed — please try again.' };
  }

  return { signInWithGoogle, isPending: getGoogleOAuthUrl.isPending || exchangeCodeForSession.isPending };
}
