import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { DealsRepository } from '../deals/deals.repository';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityStageDto } from './dto/update-opportunity-stage.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { paginate, resolvePagination, PaginationParams } from '../common/pagination';

export type OpportunityStage = 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'won' | 'lost';

const OPPORTUNITY_COLUMNS = '*, opportunity_stage_history(*)';

// Forward-only through the live stages, plus any non-terminal stage can go
// straight to 'lost'; both 'won'/'lost' are terminal — mirrors
// leads.repository.ts's ALLOWED_STATUS_TRANSITIONS shape exactly, enforced
// here (not the update_opportunity_stage RPC, which accepts any to_stage
// unconditionally) same "validated in Nest, RPC just writes" split as leads.
const ALLOWED_STAGE_TRANSITIONS: Record<OpportunityStage, OpportunityStage[]> = {
  qualification: ['needs_analysis', 'proposal', 'negotiation', 'won', 'lost'],
  needs_analysis: ['proposal', 'negotiation', 'won', 'lost'],
  proposal: ['negotiation', 'won', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: [],
};

export interface OpportunityListFilters extends PaginationParams {
  stage?: OpportunityStage;
  agentId?: string;
  scope?: 'own' | 'agency';
  listingId?: string;
}

// Same scope/ownership discipline as LeadsRepository — every method takes
// the requesting user and applies scope inside the query itself, no
// unscoped variant a controller could call by mistake.
@Injectable()
export class OpportunitiesRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly deals: DealsRepository,
  ) {}

  async list(scope: AuthenticatedUser, filters: OpportunityListFilters) {
    const pagination = resolvePagination(filters);

    let query = this.supabase.client
      .from('opportunities')
      .select(OPPORTUNITY_COLUMNS, { count: 'exact' })
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
    }
    if (filters.stage) query = query.eq('stage', filters.stage);
    if (filters.listingId) query = query.eq('listing_id', filters.listingId);
    query = query.range(pagination.from, pagination.to);

    return paginate(query, pagination);
  }

  async findById(scope: AuthenticatedUser, id: string) {
    await this.assertCanAccessOpportunity(scope, id);
    const { data, error } = await this.supabase.client.from('opportunities').select(OPPORTUNITY_COLUMNS).eq('id', id).single();
    if (error) throw error;
    return data;
  }

  // Direct-creation path — always under the caller's own agent_id (no
  // on-behalf-of super_admin path here, unlike convertFromLead below,
  // since there's no existing lead/agent to defer to).
  async create(caller: AuthenticatedUser, input: CreateOpportunityDto) {
    if (!caller.agentId) {
      throw new BadRequestException('Only an agent account can create an opportunity.');
    }
    if (input.listingId && input.projectId) {
      throw new BadRequestException('An opportunity can reference a listing or a project, not both.');
    }
    if (input.listingId) {
      // Previously trusted blindly — any agent could attach another
      // agent's (or agency's) listingId here with no check at all, then
      // later mark that opportunity 'won', producing a deals row that
      // falsely attributes a sale/rental to a listing they don't manage.
      // Same ownership rule DealsRepository.assertCanCloseListing enforces
      // for mark-sold/mark-rented.
      const { data: listing, error: listingError } = await this.supabase.client
        .from('listings')
        .select('agent_id')
        .eq('id', input.listingId)
        .maybeSingle();
      if (listingError) throw listingError;
      if (!listing) throw new BadRequestException('Listing not found.');
      if (listing.agent_id !== caller.agentId) {
        const agencyStaffIds = await this.getSameAgencyAgentIds(caller.agentId);
        if (!agencyStaffIds || !listing.agent_id || !agencyStaffIds.includes(listing.agent_id)) {
          throw new ForbiddenException('You do not have access to this listing.');
        }
      }
    }

    const agencyId = await this.getAgencyIdForAgent(caller.agentId);

    const { data, error } = await this.supabase.client.rpc('create_opportunity', {
      p_name: input.name,
      p_value: input.value,
      p_expected_close_date: input.expectedCloseDate,
      p_agent_id: caller.agentId,
      p_agency_id: agencyId,
      p_listing_id: input.listingId ?? null,
      p_project_id: input.projectId ?? null,
      p_created_by: caller.id,
      p_deal_type: input.dealType ?? 'sale',
    });
    if (error) throw error;

    return this.findById(caller, data as string);
  }

  // Promotes an existing lead. The new opportunity is always booked under
  // the LEAD's own agent_id, not necessarily the caller's — mirrors
  // DealsRepository.markClosed's "always booked under the target's own
  // agent" convention, letting a super_admin convert on an agent's behalf
  // the same way they can update a lead's status on an agent's behalf.
  async convertFromLead(caller: AuthenticatedUser, leadId: string, input: { name: string; value: number; expectedCloseDate: string; dealType?: 'sale' | 'rent' }) {
    const { data: lead, error: leadError } = await this.supabase.client
      .from('leads')
      .select('id, status, agent_id, listing_id, project_id')
      .eq('id', leadId)
      .maybeSingle();
    if (leadError) throw leadError;
    if (!lead) throw new NotFoundException('Lead not found.');

    if (caller.role !== 'super_admin' && lead.agent_id !== caller.agentId) {
      const agencyStaffIds = await this.getSameAgencyAgentIds(caller.agentId);
      if (!agencyStaffIds || !lead.agent_id || !agencyStaffIds.includes(lead.agent_id)) {
        throw new ForbiddenException('You do not have access to this lead.');
      }
    }
    if (!lead.agent_id) {
      throw new BadRequestException('Assign this lead to an agent before converting it to an opportunity.');
    }
    if (!['contacted', 'negotiating'].includes(lead.status)) {
      throw new BadRequestException('Only a contacted or negotiating lead can be converted to an opportunity.');
    }

    const agencyId = await this.getAgencyIdForAgent(lead.agent_id);

    const { data, error } = await this.supabase.client.rpc('convert_lead_to_opportunity', {
      p_lead_id: leadId,
      p_name: input.name,
      p_value: input.value,
      p_expected_close_date: input.expectedCloseDate,
      p_agent_id: lead.agent_id,
      p_agency_id: agencyId,
      p_listing_id: lead.listing_id,
      p_project_id: lead.project_id,
      p_created_by: caller.id,
      p_deal_type: input.dealType ?? 'sale',
    });
    // The partial unique index (opportunities_active_lead_id_uidx) is the
    // real backstop against a race between two concurrent conversions of
    // the same lead — surfaced here as a clear 409, not a raw Postgres
    // constraint error.
    if (error) {
      if ((error as any).code === '23505') {
        throw new BadRequestException('This lead already has an active opportunity.');
      }
      throw error;
    }

    return this.findById(caller, data as string);
  }

  async updateStage(caller: AuthenticatedUser, id: string, input: UpdateOpportunityStageDto) {
    await this.assertCanAccessOpportunity(caller, id);

    const { data: opportunity, error: fetchError } = await this.supabase.client
      .from('opportunities')
      .select('stage, agent_id, listing_id, deal_type, value')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    const fromStage = opportunity.stage as OpportunityStage;
    const toStage = input.toStage as OpportunityStage;
    // Checked independently of the transition-table lookup below — that
    // check only fires when fromStage !== toStage, which would otherwise
    // let a duplicate/retried "toStage: 'won'" call on an ALREADY-won
    // opportunity slip straight through (same-stage requests never hit
    // ALLOWED_STAGE_TRANSITIONS['won'] === [] at all) and re-run the
    // deal-creation block below, inserting a second `deals` row and
    // double-counting commission for the same opportunity.
    if (fromStage === 'won' || fromStage === 'lost') {
      throw new BadRequestException('This opportunity is already closed.');
    }
    if (fromStage !== toStage && !ALLOWED_STAGE_TRANSITIONS[fromStage].includes(toStage)) {
      throw new BadRequestException(`Cannot move an opportunity from "${fromStage}" to "${toStage}".`);
    }
    if (toStage === 'lost' && !input.lostReason?.trim()) {
      throw new BadRequestException('A reason is required when marking an opportunity lost.');
    }

    let dealId: string | null = null;
    if (toStage === 'won') {
      // deals.listing_id is NOT NULL (0064_deals_and_commission.sql) —
      // unlike an opportunity, which may have no attached listing (a
      // project-only or fully off-market opportunity). Rather than
      // weakening that existing invariant for every other deals consumer,
      // a listing is required to actually close — a real, defensible
      // product rule (closing a sale/rent means a specific unit, not just
      // a project-wide intent).
      if (!opportunity.listing_id) {
        throw new BadRequestException('This opportunity has no attached listing — attach one before marking it won.');
      }
      const deal = await this.deals.createFromOpportunity({
        opportunityId: id,
        listingId: opportunity.listing_id,
        agentId: opportunity.agent_id,
        dealType: opportunity.deal_type,
        amount: Number(opportunity.value),
        createdBy: caller.id,
      });
      dealId = deal.id;
    }

    const { error } = await this.supabase.client.rpc('update_opportunity_stage', {
      p_opportunity_id: id,
      p_to_stage: toStage,
      p_changed_by: caller.id,
      p_deal_id: dealId,
      p_lost_reason: toStage === 'lost' ? input.lostReason : null,
    });
    if (error) throw error;

    return this.findById(caller, id);
  }

  async update(caller: AuthenticatedUser, id: string, input: UpdateOpportunityDto) {
    await this.assertCanAccessOpportunity(caller, id);

    const { data, error } = await this.supabase.client
      .from('opportunities')
      .update({
        value: input.value,
        expected_close_date: input.expectedCloseDate,
        probability: input.probability,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(OPPORTUNITY_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  // Funnel & conversion analytics (Phase 4) — stage conversion rates, open
  // pipeline value, win/loss, and probability-weighted forecast. Aggregated
  // in-memory over the matching rows, same style as
  // DealsRepository.getRevenue (supabase-js has no native GROUP BY).
  // Two-step query rather than an embedded !inner() join filter — no
  // precedent for that syntax anywhere else in this codebase, this follows
  // the established "resolve scoped ids first, filter the real query with
  // .in()" pattern every other repository here already uses.
  async getFunnel(caller: AuthenticatedUser, filters: { scope?: 'own' | 'agency'; agentId?: string; dateFrom?: string; dateTo?: string } = {}) {
    const agentIds = await this.resolveScopedAgentIds(caller, filters);

    let opportunitiesQuery = this.supabase.client.from('opportunities').select('id, stage, value, probability, created_at');
    if (agentIds) opportunitiesQuery = opportunitiesQuery.in('agent_id', agentIds);
    if (filters.dateFrom) opportunitiesQuery = opportunitiesQuery.gte('created_at', filters.dateFrom);
    if (filters.dateTo) {
      // created_at is timestamptz — a bare date ('2026-08-25') parses as
      // midnight UTC, silently excluding that entire day's opportunities.
      // Treat a time-less dateTo as end-of-day instead.
      const dateTo = filters.dateTo.includes('T') ? filters.dateTo : `${filters.dateTo}T23:59:59.999Z`;
      opportunitiesQuery = opportunitiesQuery.lte('created_at', dateTo);
    }
    const { data: opportunities, error: opportunitiesError } = await opportunitiesQuery;
    if (opportunitiesError) throw opportunitiesError;

    const rows = opportunities ?? [];
    const opportunityIds = rows.map((r: any) => r.id as string);

    let openPipelineValue = 0;
    let openPipelineCount = 0;
    let forecastedRevenue = 0;
    let won = 0;
    let lost = 0;
    for (const row of rows as any[]) {
      const value = Number(row.value);
      const probability = Number(row.probability);
      if (row.stage === 'won') won++;
      else if (row.stage === 'lost') lost++;
      else {
        openPipelineValue += value;
        openPipelineCount++;
        forecastedRevenue += (value * probability) / 100;
      }
    }

    // Stage conversion: for each live stage, how many opportunities in
    // scope EVER reached it (from opportunity_stage_history, not current
    // stage — a since-lost or since-won opportunity still counts toward
    // every stage it passed through on the way), divided by how many
    // reached the stage before it. 'lost' is excluded from this funnel
    // ordering — it's a separate exit metric (winLoss below), not a stage
    // in the forward-progress sense the funnel visualizes.
    const FUNNEL_STAGES: OpportunityStage[] = ['qualification', 'needs_analysis', 'proposal', 'negotiation', 'won'];
    const reachedByStage = new Map<OpportunityStage, Set<string>>();
    if (opportunityIds.length > 0) {
      const { data: historyRows, error: historyError } = await this.supabase.client
        .from('opportunity_stage_history')
        .select('opportunity_id, to_stage')
        .in('opportunity_id', opportunityIds);
      if (historyError) throw historyError;
      for (const row of (historyRows ?? []) as any[]) {
        const set = reachedByStage.get(row.to_stage as OpportunityStage) ?? new Set<string>();
        set.add(row.opportunity_id);
        reachedByStage.set(row.to_stage as OpportunityStage, set);
      }
    }

    const stageConversion = FUNNEL_STAGES.map((stage, index) => {
      const reachedCount = reachedByStage.get(stage)?.size ?? 0;
      const previousStage = index > 0 ? FUNNEL_STAGES[index - 1] : null;
      const previousCount = previousStage ? (reachedByStage.get(previousStage)?.size ?? 0) : null;
      const conversionFromPrevious = previousCount ? Math.round((reachedCount / previousCount) * 1000) / 10 : null;
      return { stage, reachedCount, conversionFromPrevious };
    });

    return {
      stageConversion,
      openPipelineValue,
      openPipelineCount,
      won,
      lost,
      winLossRatio: lost > 0 ? Math.round((won / lost) * 100) / 100 : null,
      forecastedRevenue,
    };
  }

  // Same scope resolution list()/findById() apply inline — extracted here
  // since getFunnel() needs the plain resolved id list (not a query
  // builder already filtered by it) to reuse across two separate queries
  // (opportunities + opportunity_stage_history).
  private async resolveScopedAgentIds(
    caller: AuthenticatedUser,
    filters: { scope?: 'own' | 'agency'; agentId?: string },
  ): Promise<string[] | null> {
    if (caller.role === 'super_admin') {
      return filters.agentId ? [filters.agentId] : null;
    }
    const agencyStaffIds = filters.scope === 'agency' ? await this.getSameAgencyAgentIds(caller.agentId) : null;
    return agencyStaffIds ?? (caller.agentId ? [caller.agentId] : []);
  }

  // Public so ActivityRepository (Phase 2) can reuse the exact same access
  // rule instead of duplicating it — same convention as
  // LeadsRepository.assertCanAccessLead.
  async assertCanAccessOpportunity(scope: AuthenticatedUser, id: string): Promise<void> {
    if (scope.role === 'super_admin') return;

    const { data: opportunity, error } = await this.supabase.client.from('opportunities').select('agent_id').eq('id', id).single();
    if (error) throw error;

    if (opportunity.agent_id === scope.agentId) return;

    const agencyStaffIds = await this.getSameAgencyAgentIds(scope.agentId);
    if (agencyStaffIds && opportunity.agent_id && agencyStaffIds.includes(opportunity.agent_id)) return;

    throw new ForbiddenException('You do not have access to this opportunity.');
  }

  // Copied rather than shared from LeadsRepository/DealsRepository's
  // identical helper — same "copied rather than shared" call made in both
  // of those, to avoid a cross-module dependency for one small lookup.
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

  private async getAgencyIdForAgent(agentId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client.from('agent_profiles').select('agency_id').eq('id', agentId).maybeSingle();
    if (error) throw error;
    return data?.agency_id ?? null;
  }
}
