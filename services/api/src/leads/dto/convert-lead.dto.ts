import { IsIn, IsISO8601, IsNumber, IsOptional, IsPositive, IsString, Length } from 'class-validator';

const DEAL_TYPES = ['sale', 'rent'] as const;

// "Convert to Opportunity" — promotes an existing lead into a real
// pre-close pipeline opportunity (services/api/src/opportunities/). See
// LeadsRepository.convertToOpportunity() for eligibility rules (lead
// status must be contacted/negotiating, no active opportunity already
// exists for it).
export class ConvertLeadDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsNumber()
  @IsPositive()
  value!: number;

  @IsISO8601()
  expectedCloseDate!: string;

  @IsOptional()
  @IsIn(DEAL_TYPES)
  dealType?: (typeof DEAL_TYPES)[number];
}
