import { IsOptional, IsUUID } from 'class-validator';

export class AssignSubscriptionDto {
  @IsUUID()
  tierId!: string;

  @IsOptional()
  currentPeriodEnd?: string;
}
