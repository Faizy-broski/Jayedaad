import { IsOptional, IsString, MinLength } from 'class-validator';

// Agent editing their own still-open ticket — distinct from
// UpdateSupportTicketStatusDto (Super Admin's status/note update).
export class UpdateSupportTicketDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  subject?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  message?: string;
}
