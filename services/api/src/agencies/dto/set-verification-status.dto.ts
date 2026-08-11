import { IsIn, IsOptional, IsString } from 'class-validator';

export class SetAgencyVerificationStatusDto {
  @IsIn(['verified', 'rejected'])
  status!: 'verified' | 'rejected';

  // Only meaningful when status: 'rejected' — AgenciesRepository.setVerificationStatus
  // clears rejection_reason back to null on any 'verified' write regardless
  // of what's passed here.
  @IsOptional()
  @IsString()
  reason?: string;
}
