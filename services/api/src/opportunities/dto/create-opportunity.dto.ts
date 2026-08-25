import { IsIn, IsISO8601, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Length } from 'class-validator';

const DEAL_TYPES = ['sale', 'rent'] as const;

// Direct-creation path — an opportunity with no source lead (a walk-in/
// referral). Always created under the caller's own agent_id (see
// OpportunitiesController.create — agent-only, no on-behalf-of path here,
// unlike convert-from-lead which can be done by super_admin on a lead's
// existing agent's behalf).
export class CreateOpportunityDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsNumber()
  @IsPositive()
  value!: number;

  @IsISO8601()
  expectedCloseDate!: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsIn(DEAL_TYPES)
  dealType?: (typeof DEAL_TYPES)[number];
}
