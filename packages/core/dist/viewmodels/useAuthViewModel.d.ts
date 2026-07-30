import { AuthCredentials, SignUpInput } from '../services/authService';
export declare function useAuthViewModel(): {
    session: import("@supabase/supabase-js").AuthSession | null;
    user: import("@supabase/supabase-js").AuthUser | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    isEmailVerified: boolean;
    isEmailVerifiedLoading: boolean;
    refetchEmailVerified: (options?: import("@tanstack/react-query").RefetchOptions) => Promise<import("@tanstack/react-query").QueryObserverResult<boolean, Error>>;
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
    }, Error, SignUpInput, unknown>;
    signOut: import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
    signInWithGoogle: import("@tanstack/react-query").UseMutationResult<{
        provider: import("@supabase/supabase-js").Provider;
        url: string;
    }, Error, string, unknown>;
    getGoogleOAuthUrl: import("@tanstack/react-query").UseMutationResult<string, Error, string, unknown>;
    exchangeCodeForSession: import("@tanstack/react-query").UseMutationResult<{
        user: import("@supabase/supabase-js").AuthUser;
        session: import("@supabase/supabase-js").AuthSession;
    }, Error, string, unknown>;
    sendOtp: import("@tanstack/react-query").UseMutationResult<{
        sent: true;
    }, Error, void, unknown>;
    verifyOtp: import("@tanstack/react-query").UseMutationResult<{
        verified: true;
    }, Error, string, unknown>;
    requestPasswordReset: import("@tanstack/react-query").UseMutationResult<{
        sent: true;
    }, Error, string, unknown>;
    confirmPasswordReset: import("@tanstack/react-query").UseMutationResult<{
        reset: true;
    }, Error, {
        email: string;
        code: string;
        newPassword: string;
    }, unknown>;
    changePassword: import("@tanstack/react-query").UseMutationResult<{
        user: import("@supabase/supabase-js").AuthUser;
    }, Error, {
        oldPassword: string;
        newPassword: string;
    }, unknown>;
    deleteAccount: import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
};
