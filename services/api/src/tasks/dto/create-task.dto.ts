import { IsISO8601, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  // Optional — a personal to-do doesn't have to be about a lead. When set,
  // TasksRepository runs it through LeadsRepository.assertCanAccessLead()
  // (a task about a lead you can't see shouldn't be creatable).
  @IsOptional()
  @IsUUID()
  leadId?: string;
}
