import { OtpRepository } from './otp.repository';
import { MailerService } from './mailer.service';
export declare class OtpService {
    private readonly repo;
    private readonly mailer;
    constructor(repo: OtpRepository, mailer: MailerService);
    sendCode(userId: string): Promise<{
        sent: true;
    }>;
    verifyCode(userId: string, code: string): Promise<{
        verified: true;
    }>;
    getStatus(userId: string): Promise<{
        emailVerified: boolean;
    }>;
}
