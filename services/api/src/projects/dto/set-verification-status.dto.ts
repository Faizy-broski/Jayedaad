import { IsIn } from 'class-validator';

export class SetProjectVerificationStatusDto {
  @IsIn(['verified', 'rejected'])
  status!: 'verified' | 'rejected';
}
