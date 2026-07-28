import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { useAuthStore } from '../state/useAuthStore';
// Thin wrapper so apps/web and apps/mobile call Supabase Auth directly
// (signUp/signInWithPassword/signOut) for identity — this API layer never
// issues tokens itself (see services/api/src/auth/jwt-auth.guard.ts).
let client;
let currentAccessToken;
export function configureSupabaseClient(options) {
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
    client.auth.onAuthStateChange((_event, session) => {
        currentAccessToken = session?.access_token;
        useAuthStore.getState().setSession(session);
    });
    return client;
}
export function getSupabaseClient() {
    if (!client) {
        throw new Error('Supabase client not configured — call configureSupabaseClient() at app startup first');
    }
    return client;
}
// Synchronous accessor so httpClient's request interceptor (see httpClient.ts)
// can attach the bearer token without turning every request into an async chain.
export function getCurrentAccessToken() {
    return currentAccessToken;
}
