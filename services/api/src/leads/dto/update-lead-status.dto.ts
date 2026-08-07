import { IsIn } from 'class-validator';

const LEAD_STATUSES = ['new', 'contacted', 'negotiating', 'closed', 'lost'] as const;

// Replaces the previous unvalidated `@Body('status') status: any` read in
// leads.controller.ts — that bypassed the global ValidationPipe entirely
// (only class-decorated DTOs go through it), so a bad value only ever
// surfaced as a raw Postgres enum-cast error via AllExceptionsFilter.
export class UpdateLeadStatusDto {
  @IsIn(LEAD_STATUSES)
  status!: (typeof LEAD_STATUSES)[number];
}
