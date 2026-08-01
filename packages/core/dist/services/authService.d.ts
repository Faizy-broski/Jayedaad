import type { User } from '@supabase/supabase-js';
import { Role } from '../models';
export interface AuthCredentials {
    email: string;
    password: string;
}
export interface SignUpInput extends AuthCredentials {
    name?: string;
    phone?: string;
    marketingOptIn?: boolean;
    termsAcceptedAt?: string;
}
export declare function signInWithPassword({ email, password }: AuthCredentials): Promise<{
    user: User;
    session: import("@supabase/supabase-js").AuthSession;
    weakPassword?: import("@supabase/supabase-js").WeakPassword;
}>;
export declare function signUp({ email, password, name, phone, marketingOptIn, termsAcceptedAt }: SignUpInput): Promise<{
    user: User | null;
    session: import("@supabase/supabase-js").AuthSession | null;
}>;
export declare function signOut(): Promise<void>;
export declare function signInWithGoogle(redirectTo: string): Promise<{
    provider: import("@supabase/supabase-js").Provider;
    url: string;
}>;
export declare function getGoogleOAuthUrl(redirectTo: string): Promise<string>;
export declare function changePassword({ email, oldPassword, newPassword, }: {
    email: string;
    oldPassword: string;
    newPassword: string;
}): Promise<{
    user: User;
}>;
export declare function exchangeCodeForSession(code: string): Promise<{
    user: User;
    session: import("@supabase/supabase-js").AuthSession;
}>;
export declare function sendOtpCode(): Promise<{
    sent: true;
}>;
export declare function verifyOtpCode(code: string): Promise<{
    verified: true;
}>;
export declare function getEmailVerified(): Promise<boolean>;
export declare function requestPasswordReset(email: string): Promise<{
    sent: true;
}>;
export declare function confirmPasswordReset(input: {
    email: string;
    code: string;
    newPassword: string;
}): Promise<{
    reset: true;
}>;
export declare function getUserRole(user: User | null): Role | undefined;
export declare function getUserAgentId(user: User | null): string | undefined;
export declare function refreshSession(): Promise<{
    user: User | null;
    session: import("@supabase/supabase-js").AuthSession | null;
}>;
