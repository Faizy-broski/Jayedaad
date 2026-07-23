import { IsIn } from 'class-validator';

const ONBOARDING_DOCUMENT_TYPES = ['company_registration', 'owner_id_card', 'tax_certificate'] as const;

// Real onboarding requirement: company registration, owner's ID card, tax certificate.
export class UploadOnboardingDocumentDto {
  @IsIn(ONBOARDING_DOCUMENT_TYPES)
  documentType!: (typeof ONBOARDING_DOCUMENT_TYPES)[number];
}
