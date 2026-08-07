import { IsIn, IsISO8601 } from 'class-validator';

const REMINDER_CHANNELS = ['in_app', 'push', 'email'] as const;

// Stored/shown regardless of value, but actual delivery is always in-app
// today — real push/email dispatch is a separate, later integration (same
// caveat notifications.repository.ts already documents for the underlying
// table). See RemindersService's firing job.
export class CreateReminderDto {
  @IsISO8601()
  remindAt!: string;

  @IsIn(REMINDER_CHANNELS)
  channel!: (typeof REMINDER_CHANNELS)[number];
}
