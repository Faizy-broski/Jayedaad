import { IsOptional, IsString } from 'class-validator';

// Self-service equivalent of agents/dto/update-profile.dto.ts, but scoped to
// the plain profiles table (display_name/phone) — the only two fields every
// role (buyer/owner/agent/staff/admin) actually has. Landline/city/address/
// photo remain agent_profiles-only, no equivalent here.
export class UpdateOwnProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
