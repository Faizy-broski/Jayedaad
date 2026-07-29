import { OtpRepository } from '../otp/otp.repository';
import { MailerService } from '../otp/mailer.service';
import { SupabaseService } from '../../supabase/supabase.service';
export declare class PasswordResetService {
    private readonly repo;
    private readonly mailer;
    private readonly supabase;
    constructor(repo: OtpRepository, mailer: MailerService, supabase: SupabaseService);
    requestReset(email: string): Promise<{
        sent: true;
    }>;
    confirmReset(email: string, code: string, newPassword: string): Promise<{
        reset: true;
    }>;
}
