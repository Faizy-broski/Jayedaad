import { SupabaseService } from '../supabase/supabase.service';
export declare class AdminRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    getPlatformStats(): Promise<{
        usersByRole: Record<string, number>;
        agenciesByVerificationStatus: Record<string, number>;
        listingsByStatus: Record<string, number>;
        leadsByStatus: Record<string, number>;
        activeSubscriptionsByTier: Record<string, number>;
    }>;
    listAgentsOverview(): Promise<{
        id: any;
        displayName: any;
        phone: any;
        city: any;
        verificationStatus: any;
        agency: {
            id: any;
            name: any;
            slug: any;
        } | null;
        subscription: {
            status: any;
            currentPeriodEnd: any;
            tierName: any;
        } | null;
        listingCounts: {
            total: number;
            verified: number;
        };
    }[]>;
}
