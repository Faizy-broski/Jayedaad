export declare class MailerService {
    private transporter;
    private getTransporter;
    sendOtpEmail(to: string, code: string): Promise<void>;
    sendPasswordResetEmail(to: string, code: string): Promise<void>;
}
