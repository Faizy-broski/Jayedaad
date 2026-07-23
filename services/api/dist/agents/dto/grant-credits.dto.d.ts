declare const CREDIT_TYPES: readonly ["listing_quota", "refresh", "hot", "super_hot"];
export declare class GrantCreditsDto {
    creditType: (typeof CREDIT_TYPES)[number];
    total?: number;
    used?: number;
}
export {};
