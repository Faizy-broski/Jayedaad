import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { LeadsRepository } from '../leads/leads.repository';
import { CreateReminderDto } from './dto/create-reminder.dto';

// Always lead-scoped (reminders.lead_id is `not null` — see
// 0001_init.sql:336-343) — every method reuses LeadsRepository's own
// ownership check rather than duplicating the agency/agent-scoping logic.
@Injectable()
export class RemindersRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly leads: LeadsRepository,
  ) {}

  async listForLead(scope: AuthenticatedUser, leadId: string) {
    await this.leads.assertCanAccessLead(scope, leadId);
    const { data, error } = await this.supabase.client
      .from('reminders')
      .select('*')
      .eq('lead_id', leadId)
      .order('remind_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async create(scope: AuthenticatedUser, leadId: string, input: CreateReminderDto) {
    await this.leads.assertCanAccessLead(scope, leadId);
    const { data, error } = await this.supabase.client
      .from('reminders')
      .insert({ lead_id: leadId, remind_at: input.remindAt, channel: input.channel })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(scope: AuthenticatedUser, id: string): Promise<{ id: string }> {
    const { data: reminder, error: findError } = await this.supabase.client
      .from('reminders')
      .select('lead_id')
      .eq('id', id)
      .single();
    if (findError) throw findError;
    await this.leads.assertCanAccessLead(scope, reminder.lead_id);

    const { error } = await this.supabase.client.from('reminders').delete().eq('id', id);
    if (error) throw error;
    return { id };
  }

  // Firing job's read side — every reminder whose time has come and hasn't
  // fired yet, with the owning lead's agent_id embedded so RemindersService
  // doesn't need a second round trip per reminder.
  async listDue() {
    const { data, error } = await this.supabase.client
      .from('reminders')
      .select('id, lead_id, channel, leads(agent_id)')
      .lte('remind_at', new Date().toISOString())
      .is('fired_at', null);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      leadId: row.lead_id,
      channel: row.channel,
      agentId: row.leads?.agent_id ?? null,
    }));
  }

  async markFired(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('reminders').update({ fired_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }
}
