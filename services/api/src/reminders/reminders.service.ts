import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersRepository } from './reminders.repository';
import { LeadsRepository } from '../leads/leads.repository';

// Reminders have no delivery mechanism of their own — this job is what
// actually turns a scheduled reminders row into something a person sees.
// Every minute, fires anything whose remind_at has passed and hasn't fired
// yet, notifying the lead's assigned agent (unassigned leads have no one to
// notify — skipped, not an error). `channel` is stored and shown in the UI
// but delivery is always in-app today regardless of its value — real
// push/email dispatch is a separate, later integration, same caveat
// notifications.repository.ts already documents for the underlying table.
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly reminders: RemindersRepository,
    private readonly leads: LeadsRepository,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async fireDueReminders(): Promise<void> {
    const due = await this.reminders.listDue();
    for (const reminder of due) {
      if (reminder.agentId) {
        await this.leads.notifyAgent(reminder.agentId, {
          title: 'Follow-up reminder',
          body: "It's time to follow up on a lead.",
          relatedLeadId: reminder.leadId,
        });
      } else {
        this.logger.warn(`Reminder ${reminder.id} fired for an unassigned lead — no one to notify.`);
      }
      await this.reminders.markFired(reminder.id);
    }
  }
}
