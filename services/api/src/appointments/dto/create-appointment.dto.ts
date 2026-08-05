import { IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  title!: string;

  @IsISO8601()
  scheduledAt!: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Defaults to 'requested' (matches the DB default) — an agent
  // proactively scheduling their own appointment typically passes
  // 'confirmed' instead, since nothing is pending their own decision.
  @IsOptional()
  @IsIn(['requested', 'confirmed', 'completed', 'cancelled'])
  status?: 'requested' | 'confirmed' | 'completed' | 'cancelled';
}
