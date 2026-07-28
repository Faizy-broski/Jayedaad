import type { Session, User } from '@supabase/supabase-js';
export interface AuthState {
    session: Session | null;
    user: User | null;
    isInitializing: boolean;
    setSession: (session: Session | null) => void;
    setInitializing: (isInitializing: boolean) => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
