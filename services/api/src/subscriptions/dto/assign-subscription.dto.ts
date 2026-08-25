import { IsIn, IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class AssignSubscriptionDto {
  @IsUUID()
  tierId!: string;

  @IsOptional()
  @IsISO8601()
  currentPeriodEnd?: string;

  // Lets Super Admin's PATCH /subscriptions/:agentId/assign override comp
  // an agent onto the annual interval (no Stripe payment involved on this
  // path). Defaults to 'month' in the repository when omitted.
  @IsOptional()
  @IsIn(['month', 'year'])
  billingInterval?: 'month' | 'year';
}
