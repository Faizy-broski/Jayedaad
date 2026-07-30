import { SupabaseService } from '../supabase/supabase.service';
export declare class HealthController {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    check(): Promise<{
        status: string;
        service: string;
        database: string;
        timestamp: string;
    }>;
}
