import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  user: User | null;
  // True until the first getSession() call resolves — lets a route guard
  // distinguish "still checking" from "confirmed logged out" and avoid a
  // flash-of-redirect on page load.
  isInitializing: boolean;
  setSession: (session: Session | null) => void;
  setInitializing: (isInitializing: boolean) => void;
}

// Reactive session state — Zustand, per the documented state-management
// split (React Query owns server data; Zustand owns local/UI state that
// needs to be read reactively across many components with no Provider-tree
// overhead, and works identically on web and React Native). Populated by
// configureSupabaseClient()'s onAuthStateChange listener (see
// supabaseClient.ts) — components should read this via useAuthStore(),
// never call Supabase's auth API directly (see authService.ts for the
// sign-in/up/out functions apps are expected to call instead).
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isInitializing: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setInitializing: (isInitializing) => set({ isInitializing }),
}));
