import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class AssignSubscriptionDto {
  @IsUUID()
  tierId!: string;

  @IsOptional()
  @IsISO8601()
  currentPeriodEnd?: string;
}
