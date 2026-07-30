import { SupabaseService } from '../supabase/supabase.service';
export declare const ALLOWED_LISTING_MEDIA_MIME_TYPES: string[];
export declare const MAX_LISTING_MEDIA_SIZE_BYTES: number;
export declare class ListingMediaService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    private get bucket();
    upload(userId: string, file: Express.Multer.File): Promise<{
        url: string;
        type: 'image' | 'video';
    }>;
}
