export declare class CreateSubscriptionTierDto {
    name: string;
    listingQuota: number;
    price?: number;
    analyticsDepth: Record<string, unknown>;
}
export declare class UpdateSubscriptionTierDto {
    name?: string;
    listingQuota?: number;
    price?: number;
    analyticsDepth?: Record<string, unknown>;
}
