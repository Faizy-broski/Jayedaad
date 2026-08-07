import { IsString, Length } from 'class-validator';

// Replaces the previous unvalidated `@Body('body') body: string` read in
// leads.controller.ts — same ValidationPipe-bypass issue as
// UpdateLeadStatusDto.
export class AddLeadNoteDto {
  @IsString()
  @Length(1, 2000)
  body!: string;
}
