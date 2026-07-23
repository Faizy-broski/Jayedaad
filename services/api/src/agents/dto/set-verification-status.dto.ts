import { IsIn } from 'class-validator';

export class SetAgentVerificationStatusDto {
  @IsIn(['verified', 'rejected'])
  status!: 'verified' | 'rejected';
}
