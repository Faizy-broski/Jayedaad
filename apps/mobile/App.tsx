import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Sentry from '@sentry/react-native';
import { createClient } from '@supabase/supabase-js';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createQueryClient, configureHttpClient, configureSupabaseClient, getCurrentAccessToken } from '@jayedaad/core';
import { ToastProvider, Toast } from '@jayedaad/ui-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthGateProvider } from './src/auth/AuthGateProvider';
import { rememberMeStorage } from './src/lib/rememberMeStorage';

// Must run at module scope, as early as possible, so it's registered before
// any OAuth browser session completes (Google sign-in via WebBrowser.openAuthSessionAsync).
WebBrowser.maybeCompleteAuthSession();

// Inert unless EXPO_PUBLIC_SENTRY_DSN is actually set — no Sentry account
// exists yet as of this pass, same "absent env var -> feature inert"
// convention as EXPO_PUBLIC_GOOGLE_PLACES_API_KEY equivalents elsewhere.
// EXPO_PUBLIC_* vars bake in at build time, so this must be set before a
// real build, not toggleable at runtime.
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, environment: __DEV__ ? 'development' : 'production' });
}

configureSupabaseClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  // Default supabase-js falls back to `localStorage`, which doesn't exist in
  // React Native — without this override, sessions never persisted across
  // app restarts at all, remembered or not. rememberMeStorage additionally
  // makes persistence itself conditional on the Remember Me toggle (see
  // src/lib/rememberMeStorage.ts and LoginScreen's checkbox).
  createClient: (url, anonKey) =>
    createClient(url, anonKey, {
      auth: { storage: rememberMeStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    }),
});

configureHttpClient({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3001',
  getToken: getCurrentAccessToken,
});

function App() {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <NavigationContainer>
            <AuthGateProvider>
              <RootNavigator />
            </AuthGateProvider>
          </NavigationContainer>
          <StatusBar style="auto" />
        </ToastProvider>
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// Sentry.wrap is a no-op passthrough when Sentry.init() was never called
// above (no DSN set) — safe to apply unconditionally.
export default Sentry.wrap(App);
