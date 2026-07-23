import { SupabaseService } from '../supabase/supabase.service';
export declare const ALLOWED_DOCUMENT_MIME_TYPES: string[];
export declare const MAX_DOCUMENT_SIZE_BYTES: number;
export declare class DocumentsService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    private get bucket();
    upload(pathPrefix: string, file: Express.Multer.File): Promise<string>;
    getSignedUrl(path: string): Promise<string>;
}
