import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

// A single PATCH covers reschedule (title/scheduledAt/durationMinutes/notes)
// and status transitions (confirm/complete/cancel) — every field optional,
// only the ones present get updated.
export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['requested', 'confirmed', 'completed', 'cancelled'])
  status?: 'requested' | 'confirmed' | 'completed' | 'cancelled';
}
