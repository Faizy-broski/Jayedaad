import { IsIn, IsISO8601, IsOptional, IsString, IsUUID, Length } from 'class-validator';

const ACTIVITY_TYPES = ['call', 'email', 'whatsapp', 'meeting'] as const;

// At least one of leadId/opportunityId is required — checked in
// ActivityRepository.log() (not decorator-expressible as a clean
// "at least one of" rule), mirroring the DB's
// activity_log_entries_target_chk constraint (0070_activity_timeline_tables.sql).
export class LogActivityDto {
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsIn(ACTIVITY_TYPES)
  type!: (typeof ACTIVITY_TYPES)[number];

  // Editable — lets an agent log something that happened earlier, not just
  // "now". Defaults to now in the repository when omitted.
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @IsString()
  @Length(1, 2000)
  summary!: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  outcome?: string;
}
