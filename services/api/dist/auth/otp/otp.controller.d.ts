import { OtpService } from './otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class OtpController {
    private readonly otp;
    constructor(otp: OtpService);
    send(req: any): Promise<{
        sent: true;
    }>;
    verify(req: any, body: VerifyOtpDto): Promise<{
        verified: true;
    }>;
    status(req: any): Promise<{
        emailVerified: boolean;
    }>;
}
