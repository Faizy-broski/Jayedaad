import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { LeadsRepository } from '../leads/leads.repository';
import { OpportunitiesRepository } from '../opportunities/opportunities.repository';
import { LogActivityDto } from './dto/log-activity.dto';

const ACTIVITY_COLUMNS = 'id, lead_id, opportunity_id, type, logged_by, occurred_at, summary, outcome, created_at';

// Real interaction history — calls/emails/whatsapp/meetings logged against
// a lead and/or an opportunity (see 0070_activity_timeline_tables.sql). Reuses
// LeadsRepository.assertCanAccessLead / OpportunitiesRepository.
// assertCanAccessOpportunity for ownership checks rather than duplicating
// the own/agency-scope rule a third time.
@Injectable()
export class ActivityRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly leads: LeadsRepository,
    private readonly opportunities: OpportunitiesRepository,
  ) {}

  async log(scope: AuthenticatedUser, input: LogActivityDto) {
    if (!input.leadId && !input.opportunityId) {
      throw new BadRequestException('Provide at least one of leadId or opportunityId.');
    }
    if (input.leadId) await this.leads.assertCanAccessLead(scope, input.leadId);
    if (input.opportunityId) await this.opportunities.assertCanAccessOpportunity(scope, input.opportunityId);

    const { data, error } = await this.supabase.client.rpc('log_activity', {
      p_lead_id: input.leadId ?? null,
      p_opportunity_id: input.opportunityId ?? null,
      p_type: input.type,
      p_logged_by: scope.id,
      p_occurred_at: input.occurredAt ?? new Date().toISOString(),
      p_summary: input.summary,
      p_outcome: input.outcome ?? null,
    });
    if (error) throw error;

    const { data: entry, error: fetchError } = await this.supabase.client
      .from('activity_log_entries')
      .select(ACTIVITY_COLUMNS)
      .eq('id', data as string)
      .single();
    if (fetchError) throw fetchError;
    return entry;
  }

  async listForLead(scope: AuthenticatedUser, leadId: string) {
    await this.leads.assertCanAccessLead(scope, leadId);
    const { data, error } = await this.supabase.client
      .from('activity_log_entries')
      .select(ACTIVITY_COLUMNS)
      .eq('lead_id', leadId)
      .order('occurred_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async listForOpportunity(scope: AuthenticatedUser, opportunityId: string) {
    await this.opportunities.assertCanAccessOpportunity(scope, opportunityId);
    const { data, error } = await this.supabase.client
      .from('activity_log_entries')
      .select(ACTIVITY_COLUMNS)
      .eq('opportunity_id', opportunityId)
      .order('occurred_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
}
