import { AccountRepository } from './account.repository';
import { UpdateOwnProfileDto } from './dto/update-profile.dto';
export declare class AccountController {
    private readonly account;
    constructor(account: AccountRepository);
    updateProfile(req: any, body: UpdateOwnProfileDto): Promise<{
        displayName: any;
        phone: any;
    }>;
    deleteAccount(req: any): Promise<void>;
}
