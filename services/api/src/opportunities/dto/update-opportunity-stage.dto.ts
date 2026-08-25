import { IsIn, IsOptional, IsString } from 'class-validator';

const STAGES = ['qualification', 'needs_analysis', 'proposal', 'negotiation', 'won', 'lost'] as const;

export class UpdateOpportunityStageDto {
  @IsIn(STAGES)
  toStage!: (typeof STAGES)[number];

  // Required (checked in OpportunitiesRepository, not decorator-expressible
  // as a clean conditional-required) when toStage === 'lost'.
  @IsOptional()
  @IsString()
  lostReason?: string;
}
