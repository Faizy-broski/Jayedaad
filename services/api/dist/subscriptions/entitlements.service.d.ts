import { SupabaseService } from '../supabase/supabase.service';
export interface TierEntitlements {
    listingQuota: number;
    analyticsDepth: 'basic' | 'standard' | 'advanced' | 'full';
    viewCountDetail: 'total_only' | 'breakdown_by_source' | 'full_timeseries';
}
export declare class EntitlementsService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    getEntitlements(agentId: string): Promise<TierEntitlements>;
    getListingUsage(agentId: string): Promise<{
        used: number;
        quota: number;
    }>;
    canCreateListing(agentId: string): Promise<boolean>;
}
