declare const ONBOARDING_DOCUMENT_TYPES: readonly ["company_registration", "owner_id_card", "tax_certificate"];
export declare class UploadOnboardingDocumentDto {
    documentType: (typeof ONBOARDING_DOCUMENT_TYPES)[number];
}
export {};
