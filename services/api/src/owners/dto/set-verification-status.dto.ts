import { IsIn } from 'class-validator';

export class SetOwnerVerificationStatusDto {
  @IsIn(['verified', 'rejected'])
  status!: 'verified' | 'rejected';
}
