// NEXT_PUBLIC_* vars must be referenced as static `process.env.X` property
// accesses (not computed/dynamic) for Next.js's build-time inlining to pick
// them up — this is why the object below spells each one out literally
// instead of looping over a list of names.
//
// Read lazily inside a function, not at module scope: this file is imported
// by 'use client' components that still execute once during Next.js's
// server-side prerender pass, where these vars are legitimately unset.
export interface ClientEnv {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  googlePlacesApiKey: string;
}

export function getClientEnv(): ClientEnv {
  const env: ClientEnv = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    // Not set anywhere yet — the submit form's Area field falls back to a
    // plain text input (see PlacesAutocompleteInput.tsx) until a real key
    // with the Places API enabled is added to .env.
    googlePlacesApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? '',
  };

  // Warn rather than throw — matches configureSupabaseClient()'s own
  // graceful no-op behavior (packages/core/src/services/supabaseClient.ts),
  // so a codev's freshly-cloned checkout without .env filled in yet still
  // boots the app instead of hard-crashing on every page.
  if (typeof window !== 'undefined' && (!env.supabaseUrl || !env.supabaseAnonKey)) {
    const missing = [!env.supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL', !env.supabaseAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
      .filter(Boolean)
      .join(', ');
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing ${missing} — copy .env.example to .env at the repo root and restart. Auth will not work until this is set.`);
  }

  return env;
}
