import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';
import { Role } from '../models';

export interface AuthCredentials {
  email: string;
  password: string;
}

// Thin wrappers around Supabase Auth — apps call these instead of touching
// getSupabaseClient().auth directly, keeping direct @supabase/supabase-js
// usage confined to this package (apps/web's ESLint config blocks importing
// it directly — see .eslintrc.json). useAuthStore (state/useAuthStore.ts)
// updates reactively via configureSupabaseClient()'s onAuthStateChange
// listener, so callers don't need to do anything with these return values
// beyond error handling.
export async function signInWithPassword({ email, password }: AuthCredentials) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp({ email, password }: AuthCredentials) {
  const { data, error } = await getSupabaseClient().auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}

// role/agentId are tamper-proof claims set only via the service-role Admin
// API (see services/api/src/users/users.repository.ts) and mirrored into
// the JWT's app_metadata — the same claims JwtAuthGuard reads server-side,
// read here client-side for role-aware redirects/UI without a network call.
export function getUserRole(user: User | null): Role | undefined {
  return user?.app_metadata?.role as Role | undefined;
}

export function getUserAgentId(user: User | null): string | undefined {
  return user?.app_metadata?.agent_id as string | undefined;
}
