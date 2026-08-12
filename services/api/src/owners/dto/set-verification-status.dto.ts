import { IsIn, IsOptional, IsString } from 'class-validator';

export class SetOwnerVerificationStatusDto {
  @IsIn(['verified', 'rejected'])
  status!: 'verified' | 'rejected';

  // Only meaningful when status: 'rejected' — OwnersRepository's verify
  // method clears rejection_reason back to null on any 'verified' write
  // regardless of what's passed here.
  @IsOptional()
  @IsString()
  reason?: string;
}
