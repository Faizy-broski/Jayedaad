import { IsIn } from 'class-validator';

const LISTING_DOCUMENT_TYPES = ['id_card_front', 'id_card_back', 'ownership_proof', 'utility_bill'] as const;

// Real property-verification requirement: ID card front/back, ownership
// proof document, last utility bill.
export class UploadListingDocumentDto {
  @IsIn(LISTING_DOCUMENT_TYPES)
  documentType!: (typeof LISTING_DOCUMENT_TYPES)[number];
}
