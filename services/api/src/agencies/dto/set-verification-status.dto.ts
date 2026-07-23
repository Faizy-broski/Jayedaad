import { IsIn } from 'class-validator';

export class SetAgencyVerificationStatusDto {
  @IsIn(['verified', 'rejected'])
  status!: 'verified' | 'rejected';
}
