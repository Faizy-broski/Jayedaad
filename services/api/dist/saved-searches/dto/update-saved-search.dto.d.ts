declare const ALERT_FREQUENCIES: readonly ["instant", "daily", "weekly", "off"];
export declare class UpdateSavedSearchDto {
    alertFrequency: (typeof ALERT_FREQUENCIES)[number];
}
export {};
