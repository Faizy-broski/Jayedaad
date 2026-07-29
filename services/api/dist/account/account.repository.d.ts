import { SupabaseService } from '../supabase/supabase.service';
import { UpdateOwnProfileDto } from './dto/update-profile.dto';
export declare class AccountRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    updateProfile(userId: string, input: UpdateOwnProfileDto): Promise<{
        displayName: any;
        phone: any;
    }>;
    deleteAccount(userId: string): Promise<void>;
}
