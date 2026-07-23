declare const LISTING_DOCUMENT_TYPES: readonly ["id_card_front", "id_card_back", "ownership_proof", "utility_bill"];
export declare class UploadListingDocumentDto {
    documentType: (typeof LISTING_DOCUMENT_TYPES)[number];
}
export {};
