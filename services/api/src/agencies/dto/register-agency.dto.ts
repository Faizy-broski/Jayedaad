import { IsOptional, IsString } from 'class-validator';

// Self-service agency registration (signup's "Agency" account type) — a
// buyer registers a brand-new agency and becomes its admin in one step.
// Mirrors agents/dto/apply-as-agent.dto.ts's role (buyer-only, self-scoped),
// just also creates the agency row. Both the agency and the resulting
// agent_profiles row start 'pending' — same review-gate model as every
// other self-service path built this session.
export class RegisterAgencyDto {
  @IsString()
  agencyName!: string;

  @IsString()
  agencySlug!: string;

  @IsOptional()
  @IsString()
  agencyPhone?: string;

  @IsOptional()
  @IsString()
  agencyCity?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  agentPhone?: string;
}
