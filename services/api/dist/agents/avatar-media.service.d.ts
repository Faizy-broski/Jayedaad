import { SupabaseService } from '../supabase/supabase.service';
export declare const ALLOWED_AVATAR_MIME_TYPES: string[];
export declare const MAX_AVATAR_SIZE_BYTES: number;
export declare class AvatarMediaService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    private get bucket();
    upload(pathPrefix: string, file: Express.Multer.File): Promise<string>;
}
