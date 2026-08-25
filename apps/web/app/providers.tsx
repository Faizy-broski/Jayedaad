'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { Toaster } from 'react-hot-toast';
import {
  createQueryClient,
  configureHttpClient,
  configureSupabaseClient,
  getCurrentAccessToken,
  signOut,
} from '@jayedaad/core';
import { getClientEnv } from '@/lib/env';
import { getSupabaseCookieOptions } from '@/lib/supabaseCookieOptions';
import { TopProgressBar } from '@/components/TopProgressBar';
import { FavoritesProvider } from '@/lib/favoritesContext';
import { ThemeProvider } from '@/components/ThemeProvider';

// Guarded to the browser only: Next.js also executes 'use client' modules
// during server-side prerendering, where there's no real Supabase session to
// track and (before .env is filled in) no URL/key to construct a client
// with — running this server-side broke `next build` with "supabaseUrl is required".
if (typeof window !== 'undefined') {
  const env = getClientEnv();

  // MUST be @supabase/ssr's createBrowserClient (cookie-backed session),
  // not the plain @supabase/supabase-js client (localStorage-backed) —
  // middleware.ts's route protection reads the session from a cookie via
  // createServerClient. Passing the plain client here reproduces a real bug
  // that happened during testing: sign-in succeeds, but the very next
  // navigation to a protected route bounces straight back to /login because
  // middleware sees no session at all (localStorage isn't readable
  // server-side). See ConfigureSupabaseClientOptions in
  // packages/core/src/services/supabaseClient.ts for the full explanation.
  configureSupabaseClient({
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
    createClient: (url, anonKey) => createBrowserClient(url, anonKey, { cookieOptions: getSupabaseCookieOptions() }),
  });

  configureHttpClient({
    baseURL: env.apiBaseUrl,
    getToken: getCurrentAccessToken,
    // A 401 here means JwtAuthGuard rejected the token outright (missing,
    // malformed, or expired) — most commonly now because an admin changed
    // this account's role, which revokes its refresh tokens server-side
    // (services/api's updateRole()) so its next silent refresh fails. Force
    // a clean sign-out + full reload to /login instead of leaving a dead
    // session sitting in the tab still rendering its old cached role.
    onUnauthorized: () => {
      signOut()
        .catch(() => {})
        .finally(() => {
          window.location.href = '/login';
        });
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TopProgressBar />
        <FavoritesProvider>{children}</FavoritesProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
