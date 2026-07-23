import { SupabaseService } from '../supabase/supabase.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
export declare class SavedSearchesRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    list(userId: string): Promise<any[]>;
    create(userId: string, input: CreateSavedSearchDto): Promise<any>;
    updateAlertFrequency(userId: string, id: string, alertFrequency: string): Promise<any>;
    remove(userId: string, id: string): Promise<void>;
}
