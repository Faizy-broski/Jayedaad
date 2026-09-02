import { createClient as createSupabaseJsClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuthStore } from '../state/useAuthStore';

// Thin wrapper so apps/web and apps/mobile call Supabase Auth directly
// (signUp/signInWithPassword/signOut) for identity — this API layer never
// issues tokens itself (see services/api/src/auth/jwt-auth.guard.ts).
let client: SupabaseClient | undefined;
let currentAccessToken: string | undefined;

export interface ConfigureSupabaseClientOptions {
  url: string;
  anonKey: string;
  // Platform-specific client factory. Defaults to the plain
  // @supabase/supabase-js client (localStorage-backed session — fine for
  // apps/mobile, which has no server-side middleware reading a session
  // cookie). apps/web MUST supply @supabase/ssr's createBrowserClient here
  // instead: middleware.ts's route protection reads the session from a
  // COOKIE via @supabase/ssr's createServerClient, and the plain
  // supabase-js client stores its session in localStorage, not cookies —
  // those two don't talk to each other. Without this, sign-in succeeds
  // client-side but every protected-route navigation immediately bounces
  // back to /login because middleware sees no session at all (confirmed:
  // this exact mismatch was the cause of a real "login succeeds but never
  // reaches the dashboard" bug).
  createClient?: (url: string, anonKey: string) => SupabaseClient;
}

export function configureSupabaseClient(options: ConfigureSupabaseClientOptions): SupabaseClient | undefined {
  if (!options.url || !options.anonKey) {
    // Supabase project not wired up yet — skip instead of throwing, so local
    // dev without .env values still boots (auth calls just won't work until configured).
    // eslint-disable-next-line no-console
    console.warn('configureSupabaseClient: missing url/anonKey, Supabase client not initialized');
    useAuthStore.getState().setInitializing(false);
    return undefined;
  }

  client = (options.createClient ?? createSupabaseJsClient)(options.url, options.anonKey);

  // currentAccessToken stays a plain module variable (for httpClient's
  // synchronous interceptor, see httpClient.ts); useAuthStore is the
  // reactive counterpart components actually read from.
  client.auth.getSession().then(({ data }) => {
    currentAccessToken = data.session?.access_token;
    useAuthStore.getState().setSession(data.session);
    useAuthStore.getState().setInitializing(false);
  });
  client.auth.onAuthStateChange((event, session) => {
    // Was `_event` — discarded, so every event (a real SIGNED_OUT, a
    // routine TOKEN_REFRESHED, or a transient failed-refresh null session
    // from e.g. the web browser/middleware dual-client refresh-token race,
    // see apps/web/middleware.ts) looked identical in logs, making a real
    // "why did this session die" incident undiagnosable after the fact.
    // Diagnostic only — no behavior change.
    if (event !== 'INITIAL_SESSION') {
      // eslint-disable-next-line no-console
      console.info(`[supabaseClient] onAuthStateChange: ${event}, session=${session ? 'present' : 'null'}`);
    }
    currentAccessToken = session?.access_token;
    useAuthStore.getState().setSession(session);
  });

  return client;
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error('Supabase client not configured — call configureSupabaseClient() at app startup first');
  }
  return client;
}

// Synchronous accessor so httpClient's request interceptor (see httpClient.ts)
// can attach the bearer token without turning every request into an async chain.
export function getCurrentAccessToken(): string | undefined {
  return currentAccessToken;
}
