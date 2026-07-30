import { PasswordResetService } from './password-reset.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
export declare class PasswordResetController {
    private readonly passwordReset;
    constructor(passwordReset: PasswordResetService);
    request(body: RequestPasswordResetDto): Promise<{
        sent: true;
    }>;
    confirm(body: ConfirmPasswordResetDto): Promise<{
        reset: true;
    }>;
}
