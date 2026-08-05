import { IsIn } from 'class-validator';

const OWNER_IDENTITY_DOCUMENT_TYPES = ['cnic_front', 'cnic_back', 'selfie'] as const;

export class UploadOwnerIdentityDocumentDto {
  @IsIn(OWNER_IDENTITY_DOCUMENT_TYPES)
  documentType!: (typeof OWNER_IDENTITY_DOCUMENT_TYPES)[number];
}
