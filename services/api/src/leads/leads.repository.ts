import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import { NotificationsRepository } from '../notifications/notifications.repository';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const LEAD_COLUMNS = '*, lead_status_history(*), lead_notes(*), lead_activity(*)';

type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost';

// closed/lost are terminal — no outbound transition is allowed once a lead
// reaches either. Everything else can move forward or straight to
// closed/lost. Enforced here (not a new migration) since update_lead_status
// (0003_rpc_functions.sql) accepts any to_status unconditionally.
const ALLOWED_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'negotiating', 'closed', 'lost'],
  contacted: ['negotiating', 'closed', 'lost'],
  negotiating: ['contacted', 'closed', 'lost'],
  closed: [],
  lost: [],
};

export interface LeadListFilters {
  status?: LeadStatus;
  listingId?: string;
  // Super Admin-only — lets the "show me agent X's CRM" admin view filter
  // the otherwise cross-agent result set down to one agent. Ignored for
  // scoped roles (agent), who are already implicitly filtered to themselves.
  agentId?: string;
  // Agency Admin-only (Document Verification Phase 3) — widens the result
  // set from "my own leads" to "every associate's leads in my agency".
  // Silently ignored (falls back to own-agent scope) for a non-admin agent
  // or super_admin, same "ignored, not rejected" convention as agentId.
  scope?: 'own' | 'agency';
  // Super Admin-only — filters down to leads with no assigned agent.
  // Ignored for scoped roles (agent), same "ignored, not rejected"
  // discipline as agentId.
  unassigned?: boolean;
  page?: number;
  pageSize?: number;
}

// Every method here takes the requesting user's scope and applies it inside
// the query itself — there is no "unscoped" variant a controller could call
// by mistake. Super Admin is the only role that bypasses the agent_id filter,
// matching [Spec §5] / [Dev Instr §2.1/§2.3/§2.4].
@Injectable()
export class LeadsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly appointments: AppointmentsRepository,
    private readonly notifications: NotificationsRepository,
  ) {}

  // Server-side paginated — a busy agency's leads list can't ship every row
  // on every load, same "count: 'exact' + range()" pattern as
  // ListingsRepository.searchPublic/BlogRepository.listAll.
  async list(scope: AuthenticatedUser, filters: LeadListFilters) {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
    const pageSize = Math.min(
      filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client
      .from('leads')
      .select(LEAD_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (scope.role !== 'super_admin') {
      const agencyStaffIds = filters.scope === 'agency' ? await this.getSameAgencyAgentIds(scope.agentId) : null;
      if (agencyStaffIds) {
        query = query.in('agent_id', agencyStaffIds);
      } else {
        query = query.eq('agent_id', scope.agentId);
      }
    } else if (filters.agentId) {
      query = query.eq('agent_id', filters.agentId);
    } else if (filters.unassigned) {
      query = query.is('agent_id', null);
    }
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.listingId) query = query.eq('listing_id', filters.listingId);
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { items: data ?? [], total: count ?? 0, page, pageSize };
  }

  // Single-lead fetch — backs LeadDetailScreen.tsx (mobile), which previously
  // had no detail view to navigate to at all. Same ownership gate as
  // updateStatus()/addNote() below.
  async findById(scope: AuthenticatedUser, leadId: string) {
    await this.assertCanAccessLead(scope, leadId);
    const { data, error } = await this.supabase.client.from('leads').select(LEAD_COLUMNS).eq('id', leadId).single();
    if (error) throw error;
    return data;
  }

  // Returns every agent_profiles.id sharing callerAgentId's agency, or null
  // if the caller isn't an agency admin (or has no agency) — the caller
  // falls back to their own-agent scope in that case. Two-step lookup
  // (rather than a PostgREST embedded-filter) to keep the query shape
  // consistent with the rest of this file.
  private async getSameAgencyAgentIds(callerAgentId?: string): Promise<string[] | null> {
    if (!callerAgentId) return null;
    const { data: caller, error: callerError } = await this.supabase.client
      .from('agent_profiles')
      .select('agency_id, is_agency_admin')
      .eq('id', callerAgentId)
      .single();
    if (callerError) throw callerError;
    if (!caller.is_agency_admin || !caller.agency_id) return null;

    const { data: staff, error: staffError } = await this.supabase.client
      .from('agent_profiles')
      .select('id')
      .eq('agency_id', caller.agency_id);
    if (staffError) throw staffError;
    return (staff ?? []).map((row: any) => row.id);
  }

  // Ownership gate for updateStatus()/addNote() — those write paths never
  // checked that the target lead actually belonged to the calling agent
  // (an IDOR: any authenticated agent could mutate any lead by guessing/
  // iterating IDs). super_admin always passes. An agent passes if the lead
  // is their own, or — mirroring list()'s own agency-scope allowance —
  // belongs to any agent in their agency, when they're an agency admin.
  // Public (not private) so RemindersRepository/TasksRepository can reuse
  // the exact same access rule instead of duplicating it.
  async assertCanAccessLead(scope: AuthenticatedUser, leadId: string): Promise<void> {
    if (scope.role === 'super_admin') return;

    const { data: lead, error } = await this.supabase.client
      .from('leads')
      .select('agent_id')
      .eq('id', leadId)
      .single();
    if (error) throw error;

    if (lead.agent_id === scope.agentId) return;

    const agencyStaffIds = await this.getSameAgencyAgentIds(scope.agentId);
    if (agencyStaffIds && lead.agent_id && agencyStaffIds.includes(lead.agent_id)) return;

    throw new ForbiddenException('You do not have access to this lead.');
  }

  // Public intake path (contact form / call request / chatbot capture)
  // [Dev Instr §3.1]. agent_id resolves from the listing's current agent —
  // NULL (unassigned) if the listing has none, until J.Team assigns it.
  async create(input: CreateLeadDto) {
    const { data: listing, error: listingError } = await this.supabase.client
      .from('listings')
      .select('agent_id, owner_id')
      .eq('id', input.listingId)
      .single();
    if (listingError) throw listingError;

    // Spam/dedup guard — the same person re-submitting the same enquiry
    // (double-click, retry after a slow response, etc.) within a short
    // window returns the existing row instead of inserting a duplicate.
    // Not a replacement for the endpoint-level @Throttle() in the
    // controller, just a second layer against accidental duplicates.
    const dedupWindowStart = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentDuplicate, error: dedupError } = await this.supabase.client
      .from('leads')
      .select(LEAD_COLUMNS)
      .eq('listing_id', input.listingId)
      .eq('email', input.email)
      .gte('created_at', dedupWindowStart)
      .limit(1)
      .maybeSingle();
    if (dedupError) throw dedupError;
    if (recentDuplicate) return recentDuplicate;

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

    if (data.agent_id) {
      await this.notifyAgent(data.agent_id, {
        title: 'New lead',
        body: `${input.name} enquired about a listing you manage.`,
        relatedLeadId: data.id,
        relatedListingId: data.listing_id,
      });
    } else {
      await this.notifySuperAdmins({
        title: 'New unassigned lead',
        body: `${input.name} enquired about a listing with no assigned agent.`,
        relatedLeadId: data.id,
        relatedListingId: data.listing_id,
      });
    }

    // Book a Visit also puts a 'requested' appointment on the listing's
    // calendar (Document Verification Phase 3) — the listing's agent if one
    // is assigned, otherwise the individual owner directly (every listing
    // has an owner_id, only sometimes an agent_id).
    if (input.isVisitRequest) {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const subject = data.agent_id ? { agentId: data.agent_id } : { ownerId: listing.owner_id };
      await this.appointments.create(subject, {
        title: `Visit request — ${input.name}`,
        scheduledAt,
        leadId: data.id,
        listingId: data.listing_id,
        notes: input.message,
        status: 'requested',
      });
    }

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

    await this.notifyAgent(agentId, {
      title: 'Lead assigned to you',
      body: 'A lead was just assigned to you — take a look in your inbox.',
      relatedLeadId: leadId,
    });
  }

  // append-only: always an insert via the RPC function, never an UPDATE
  async addNote(scope: AuthenticatedUser, leadId: string, body: string) {
    await this.assertCanAccessLead(scope, leadId);
    const { error } = await this.supabase.client.rpc('add_lead_note', {
      p_lead_id: leadId,
      p_author_id: scope.id,
      p_body: body,
    });
    if (error) throw error;
  }

  async updateStatus(scope: AuthenticatedUser, leadId: string, toStatus: LeadStatus) {
    await this.assertCanAccessLead(scope, leadId);

    const { data: lead, error: leadError } = await this.supabase.client
      .from('leads')
      .select('status, agent_id')
      .eq('id', leadId)
      .single();
    if (leadError) throw leadError;

    const fromStatus = lead.status as LeadStatus;
    if (fromStatus !== toStatus && !ALLOWED_STATUS_TRANSITIONS[fromStatus].includes(toStatus)) {
      throw new BadRequestException(`Cannot move a lead from "${fromStatus}" to "${toStatus}".`);
    }

    // update + history insert happen atomically inside the Postgres function
    // (supabase/migrations/0003_rpc_functions.sql) — the equivalent of the
    // previous Prisma $transaction call.
    const { error } = await this.supabase.client.rpc('update_lead_status', {
      p_lead_id: leadId,
      p_to_status: toStatus,
      p_changed_by: scope.id,
    });
    if (error) throw error;

    // Only notify when someone other than the assigned agent made the
    // change (e.g. a super_admin or an agency admin acting on a colleague's
    // lead) — an agent updating their own lead doesn't need a notification
    // about their own action.
    if (lead.agent_id && lead.agent_id !== scope.agentId) {
      await this.notifyAgent(lead.agent_id, {
        title: 'Lead status updated',
        body: `A lead's status changed from "${fromStatus}" to "${toStatus}".`,
        relatedLeadId: leadId,
      });
    }
  }

  // super_admin-only (enforced at the controller) — mirrors the hard-delete
  // pattern already used for agencies/agents elsewhere in this codebase.
  async remove(leadId: string): Promise<{ id: string }> {
    const { error } = await this.supabase.client.from('leads').delete().eq('id', leadId);
    if (error) throw error;
    return { id: leadId };
  }

  // Public so RemindersRepository's firing job can notify a lead's agent
  // without duplicating the agent_profiles.user_id lookup.
  async notifyAgent(
    agentId: string,
    input: { title: string; body: string; relatedLeadId?: string; relatedListingId?: string },
  ): Promise<void> {
    const { data: agent, error } = await this.supabase.client
      .from('agent_profiles')
      .select('user_id')
      .eq('id', agentId)
      .single();
    if (error || !agent) return;
    await this.notifications.create({
      userId: agent.user_id,
      type: 'lead_assigned',
      title: input.title,
      body: input.body,
      relatedLeadId: input.relatedLeadId,
      relatedListingId: input.relatedListingId,
    });
  }

  private async notifySuperAdmins(input: {
    title: string;
    body: string;
    relatedLeadId?: string;
    relatedListingId?: string;
  }): Promise<void> {
    const { data: admins, error } = await this.supabase.client.from('profiles').select('id').eq('role', 'super_admin');
    if (error || !admins) return;
    await Promise.all(
      admins.map((admin: any) =>
        this.notifications.create({
          userId: admin.id,
          type: 'lead_assigned',
          title: input.title,
          body: input.body,
          relatedLeadId: input.relatedLeadId,
          relatedListingId: input.relatedListingId,
        }),
      ),
    );
  }
}
