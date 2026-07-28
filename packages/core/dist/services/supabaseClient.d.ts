import { SupabaseClient } from '@supabase/supabase-js';
export interface ConfigureSupabaseClientOptions {
    url: string;
    anonKey: string;
    createClient?: (url: string, anonKey: string) => SupabaseClient;
}
export declare function configureSupabaseClient(options: ConfigureSupabaseClientOptions): SupabaseClient | undefined;
export declare function getSupabaseClient(): SupabaseClient;
export declare function getCurrentAccessToken(): string | undefined;
