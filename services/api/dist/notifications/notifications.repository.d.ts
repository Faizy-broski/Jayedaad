import { SupabaseService } from '../supabase/supabase.service';
export type NotificationType = 'price_drop' | 'new_match' | 'inquiry_reply' | 'verification_status' | 'lead_assigned' | 'reminder';
export declare class NotificationsRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    list(userId: string): Promise<any[]>;
    markRead(userId: string, id: string): Promise<any>;
    markAllRead(userId: string): Promise<void>;
    create(input: {
        userId: string;
        type: NotificationType;
        title: string;
        body?: string;
        relatedListingId?: string;
        relatedLeadId?: string;
    }): Promise<any>;
}
