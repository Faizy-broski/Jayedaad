import { IsISO8601, IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';

// Value/expected-close-date/probability edits — does not touch stage
// (see UpdateOpportunityStageDto for that).
export class UpdateOpportunityDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  value?: number;

  @IsOptional()
  @IsISO8601()
  expectedCloseDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;
}
