import { IsIn } from 'class-validator';

const ONBOARDING_DOCUMENT_TYPES = ['company_registration', 'owner_id_card', 'tax_certificate'] as const;

// Same document set as agencies (see agencies/dto/upload-document.dto.ts) —
// an independent agent stands in as their own "company" for onboarding.
export class UploadOnboardingDocumentDto {
  @IsIn(ONBOARDING_DOCUMENT_TYPES)
  documentType!: (typeof ONBOARDING_DOCUMENT_TYPES)[number];
}
