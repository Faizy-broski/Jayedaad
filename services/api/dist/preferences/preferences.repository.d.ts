import { SupabaseService } from '../supabase/supabase.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
export declare class PreferencesRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    get(userId: string): Promise<{
        emailNotifications: any;
        newsletters: any;
        automatedReports: any;
        preferredCurrency: any;
        preferredAreaUnit: any;
    }>;
    update(userId: string, input: UpdatePreferencesDto): Promise<{
        emailNotifications: any;
        newsletters: any;
        automatedReports: any;
        preferredCurrency: any;
        preferredAreaUnit: any;
    }>;
}
