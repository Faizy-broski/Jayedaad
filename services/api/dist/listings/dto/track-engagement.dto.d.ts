declare const ENGAGEMENT_TYPES: readonly ["view", "click", "call", "whatsapp", "sms", "email"];
declare const PLATFORMS: readonly ["web", "mobile", "agent_portal", "admin"];
export declare class TrackEngagementDto {
    type: (typeof ENGAGEMENT_TYPES)[number];
    platform: (typeof PLATFORMS)[number];
    viewerSessionId: string;
}
export {};
