import { IsIn, IsOptional, IsString } from 'class-validator';

const STATUSES = ['open', 'in_progress', 'resolved'] as const;

export class UpdateSupportTicketStatusDto {
  @IsIn(STATUSES)
  status!: (typeof STATUSES)[number];

  @IsOptional()
  @IsString()
  adminNote?: string;
}
