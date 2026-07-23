declare const LEAD_SOURCES: readonly ["chatbot", "contact_form", "call_request"];
declare const INQUIRER_TYPES: readonly ["buyer_tenant", "agent", "other"];
export declare class CreateLeadDto {
    listingId: string;
    name: string;
    phone: string;
    email: string;
    message: string;
    source: (typeof LEAD_SOURCES)[number];
    inquirerType?: (typeof INQUIRER_TYPES)[number];
    wantsSimilarAlerts?: boolean;
}
export {};
