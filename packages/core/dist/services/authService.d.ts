import type { User } from '@supabase/supabase-js';
import { Role } from '../models';
export interface AuthCredentials {
    email: string;
    password: string;
}
export declare function signInWithPassword({ email, password }: AuthCredentials): Promise<{
    user: User;
    session: import("@supabase/supabase-js").AuthSession;
    weakPassword?: import("@supabase/supabase-js").WeakPassword;
}>;
export declare function signUp({ email, password }: AuthCredentials): Promise<{
    user: User | null;
    session: import("@supabase/supabase-js").AuthSession | null;
}>;
export declare function signOut(): Promise<void>;
export declare function getUserRole(user: User | null): Role | undefined;
export declare function getUserAgentId(user: User | null): string | undefined;
