declare const ALERT_FREQUENCIES: readonly ["instant", "daily", "weekly", "off"];
export declare class CreateSavedSearchDto {
    name?: string;
    filters: Record<string, unknown>;
    alertFrequency?: (typeof ALERT_FREQUENCIES)[number];
}
export {};
