import { SupabaseService } from '../supabase/supabase.service';
export declare class FavoritesRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    list(userId: string): Promise<{
        id: any;
        created_at: any;
        listings: {
            id: any;
            title: any;
            price: any;
            city: any;
            area: any;
            status: any;
        }[];
    }[]>;
    add(userId: string, listingId: string): Promise<any>;
    remove(userId: string, listingId: string): Promise<void>;
}
