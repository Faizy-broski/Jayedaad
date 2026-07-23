import { SupabaseService } from '../supabase/supabase.service';
import { ListingsRepository } from '../listings/listings.repository';
export interface AuditLogFilters {
    listingId?: string;
    reviewerId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}
export declare class VerificationRepository {
    private readonly supabase;
    private readonly listings;
    constructor(supabase: SupabaseService, listings: ListingsRepository);
    listQueue(): Promise<any[]>;
    recordAction(reviewerId: string, listingId: string, action: 'approve' | 'reject' | 'request_info', note?: string): Promise<void>;
    listAuditLog(filters?: AuditLogFilters): Promise<{
        items: {
            id: any;
            listing_id: any;
            reviewer_id: any;
            action: any;
            note: any;
            created_at: any;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
