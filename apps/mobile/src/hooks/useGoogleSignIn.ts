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
  // (openAuthSessionAsync resolves normally either way).
  async function signInWithGoogle(): Promise<{ success: boolean }> {
    const redirectTo = Linking.createURL('auth/callback');
    const url = await getGoogleOAuthUrl.mutateAsync(redirectTo);
    const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);

    if (result.type === 'success' && result.url) {
      const { queryParams } = Linking.parse(result.url);
      const code = queryParams?.code as string | undefined;
      if (code) {
        await exchangeCodeForSession.mutateAsync(code);
        return { success: true };
      }
    }
    return { success: false };
  }

  return { signInWithGoogle, isPending: getGoogleOAuthUrl.isPending || exchangeCodeForSession.isPending };
}
