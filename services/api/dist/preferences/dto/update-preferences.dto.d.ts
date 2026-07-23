declare const AREA_UNITS: readonly ["marla", "kanal", "sqyd", "sqft", "sqm", "acre"];
export declare class UpdatePreferencesDto {
    emailNotifications?: boolean;
    newsletters?: boolean;
    automatedReports?: boolean;
    preferredCurrency?: string;
    preferredAreaUnit?: (typeof AREA_UNITS)[number];
}
export {};
