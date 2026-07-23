import { AdminRepository } from './admin.repository';
export declare class AdminController {
    private readonly admin;
    constructor(admin: AdminRepository);
    getStats(): Promise<{
        usersByRole: Record<string, number>;
        agenciesByVerificationStatus: Record<string, number>;
        listingsByStatus: Record<string, number>;
        leadsByStatus: Record<string, number>;
        activeSubscriptionsByTier: Record<string, number>;
    }>;
    listAgents(): Promise<{
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
    listRoles(): import("./role-access-descriptions").RoleAccessDescription[];
}
