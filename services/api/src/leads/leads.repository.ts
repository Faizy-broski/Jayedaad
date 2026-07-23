import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';

export interface LeadListFilters {
  status?: 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost';
  listingId?: string;
}

// Every method here takes the requesting user's scope and applies it inside
// the query itself — there is no "unscoped" variant a controller could call
// by mistake. Super Admin is the only role that bypasses the agent_id filter,
// matching [Spec §5] / [Dev Instr §2.1/§2.3/§2.4].
@Injectable()
export class LeadsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async list(scope: AuthenticatedUser, filters: LeadListFilters) {
    let query = this.supabase.client
      .from('leads')
      .select('*, lead_status_history(*), lead_notes(*), lead_activity(*)')
      .order('created_at', { ascending: false });

    if (scope.role !== 'super_admin') {
      query = query.eq('agent_id', scope.agentId);
    }
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.listingId) query = query.eq('listing_id', filters.listingId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Public intake path (contact form / call request / chatbot capture)
  // [Dev Instr §3.1]. agent_id resolves from the listing's current agent —
  // NULL (unassigned) if the listing has none, until J.Team assigns it.
  async create(input: CreateLeadDto) {
    const { data: listing, error: listingError } = await this.supabase.client
      .from('listings')
      .select('agent_id')
      .eq('id', input.listingId)
      .single();
    if (listingError) throw listingError;

    const { data, error } = await this.supabase.client
      .from('leads')
      .insert({
        listing_id: input.listingId,
        agent_id: listing?.agent_id ?? null,
        name: input.name,
        phone: input.phone,
        email: input.email,
        message: input.message,
        inquirer_type: input.inquirerType,
        wants_similar_alerts: input.wantsSimilarAlerts ?? false,
        source: input.source,
        status: 'new',
      })
      .select()
      .single();
    if (error) throw error;
    // No lead_activity row on creation — the lead's own created_at already
    // reconstructs "creation" in the timeline [Dev Instr §3.1]; the
    // lead_activity_type enum has no 'creation' value to misuse here.
    return data;
  }

  // J.Team assigns/reassigns a lead [Dev Instr §3.2]. Agents cannot call this
  // themselves — enforced at the controller (@Roles('super_admin')), not here.
  async assign(assignedBy: string, leadId: string, agentId: string) {
    const { error } = await this.supabase.client.rpc('assign_lead', {
      p_lead_id: leadId,
      p_agent_id: agentId,
      p_assigned_by: assignedBy,
    });
    if (error) throw error;
  }

  // append-only: always an insert via the RPC function, never an UPDATE
  async addNote(scope: AuthenticatedUser, leadId: string, body: string) {
    const { error } = await this.supabase.client.rpc('add_lead_note', {
      p_lead_id: leadId,
      p_author_id: scope.id,
      p_body: body,
    });
    if (error) throw error;
  }

  async updateStatus(
    scope: AuthenticatedUser,
    leadId: string,
    toStatus: 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost',
  ) {
    // update + history insert happen atomically inside the Postgres function
    // (supabase/migrations/0003_rpc_functions.sql) — the equivalent of the
    // previous Prisma $transaction call.
    const { error } = await this.supabase.client.rpc('update_lead_status', {
      p_lead_id: leadId,
      p_to_status: toStatus,
      p_changed_by: scope.id,
    });
    if (error) throw error;
  }
}
