import { AuthCredentials } from '../services/authService';
export declare function useAuthViewModel(): {
    session: import("@supabase/supabase-js").AuthSession | null;
    user: import("@supabase/supabase-js").AuthUser | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    role: import("..").Role | undefined;
    agentId: string | undefined;
    signIn: import("@tanstack/react-query").UseMutationResult<{
        user: import("@supabase/supabase-js").AuthUser;
        session: import("@supabase/supabase-js").AuthSession;
        weakPassword?: import("@supabase/supabase-js").WeakPassword;
    }, Error, AuthCredentials, unknown>;
    signUp: import("@tanstack/react-query").UseMutationResult<{
        user: import("@supabase/supabase-js").AuthUser | null;
        session: import("@supabase/supabase-js").AuthSession | null;
    }, Error, AuthCredentials, unknown>;
    signOut: import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
};
