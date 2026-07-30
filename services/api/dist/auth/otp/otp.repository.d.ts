import { SupabaseService } from '../../supabase/supabase.service';
export type OtpPurpose = 'email_verification' | 'password_reset';
export declare class OtpRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    insertCode(userId: string, codeHash: string, expiresAt: Date, purpose: OtpPurpose): Promise<void>;
    findLatestActive(userId: string, purpose: OtpPurpose): Promise<{
        id: any;
        code_hash: any;
        expires_at: any;
        attempt_count: any;
        max_attempts: any;
    } | null>;
    incrementAttempt(id: string): Promise<void>;
    markConsumed(id: string): Promise<void>;
    getEmailVerified(userId: string): Promise<boolean>;
    getEmail(userId: string): Promise<string>;
    markEmailVerified(userId: string): Promise<void>;
    findUserIdByEmail(email: string): Promise<string | null>;
}
