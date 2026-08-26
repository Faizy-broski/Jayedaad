import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { MarkSoldDto } from './dto/mark-sold.dto';
import { MarkRentedDto } from './dto/mark-rented.dto';
import { paginate, resolvePagination } from '../common/pagination';

// Falls back when neither a per-deal commissionRate (MarkDealBaseDto) nor
// the closing agent's agency default_commission_rate is set — keeps
// markSold/markRented from ever computing a $0 commission_amount just
// because no rate was configured anywhere in the chain.
export const PLATFORM_DEFAULT_COMMISSION_RATE = 2; // percent

const DEAL_LIST_COLUMNS =
  'id, listing_id, agent_id, agency_id, deal_type, amount, commission_rate, commission_amount, closed_at, notes, created_at, listings (title), agent_profiles (display_name)';

export interface DealListFilters {
  // Agency Admin-only, same "ignored, not rejected" convention as
  // LeadsRepository.list's identical scope param — falls back to own-agent
  // scope for a non-admin agent.
  scope?: 'own' | 'agency';
  dealType?: 'sale' | 'rent';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export type RevenuePeriod = 'month' | 'quarter' | 'year';

export interface RevenueFilters {
  period: RevenuePeriod;
  scope?: 'own' | 'agency';
}

// month: 'YYYY-MM', quarter: 'YYYY-Q1'..'YYYY-Q4', year: 'YYYY' — sortable
// as plain strings, which byPeriod relies on below.
function bucketPeriod(closedAt: string, period: RevenuePeriod): string {
  const date = new Date(closedAt);
  const year = date.getUTCFullYear();
  if (period === 'year') return String(year);
  if (period === 'quarter') return `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  return `${year}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

// The revenue ledger backing "Mark Sold"/"Mark Rented" (called from
// ListingsController — these are listing status transitions, same family as
// renew()/boost(), just also writing a deals row) and the GET /deals,
// GET /agents/:id/revenue read endpoints.
@Injectable()
export class DealsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async markSold(listingId: string, caller: AuthenticatedUser, input: MarkSoldDto) {
    return this.markClosed(listingId, caller, {
      requiredPurpose: 'sale',
      dealType: 'sale',
      amount: input.salePrice,
      commissionRate: input.commissionRate,
      closedAt: input.closedAt,
      notes: input.notes,
      newStatus: 'sold',
      ineligibleMessage: 'Only verified sale listings can be marked sold.',
    });
  }

  async markRented(listingId: string, caller: AuthenticatedUser, input: MarkRentedDto) {
    return this.markClosed(listingId, caller, {
      requiredPurpose: 'rent',
      dealType: 'rent',
      amount: input.monthlyRent,
      commissionRate: input.commissionRate,
      closedAt: input.closedAt,
      notes: input.notes,
      newStatus: 'rented',
      ineligibleMessage: 'Only verified rental listings can be marked rented.',
    });
  }

  // Shared "guard on current status, then write" path behind markSold/
  // markRented — same guard-then-update shape as
  // ListingsRepository.renew()/boost() (status check -> BadRequestException,
  // then the actual write), extended with the deals-row insert. No DB
  // transaction/RPC exists anywhere in this codebase for a multi-table write
  // — every other multi-step repository method here (boost(), refresh(),
  // postStory()) is sequential awaits with error propagation, not a real
  // transaction — so this matches that existing convention rather than
  // introducing a new one. A failure between the insert below and the
  // status-flip update would leave a deals row with the listing still
  // 'verified', the same kind of partial-write risk boost()'s
  // credit-spend-then-listing-update sequence already accepts.
  private async markClosed(
    listingId: string,
    caller: AuthenticatedUser,
    opts: {
      requiredPurpose: 'sale' | 'rent';
      dealType: 'sale' | 'rent';
      amount: number;
      commissionRate?: number;
      closedAt?: string;
      notes?: string;
      newStatus: 'sold' | 'rented';
      ineligibleMessage: string;
    },
  ) {
    const { data: listing, error: listingError } = await this.supabase.client
      .from('listings')
      .select('purpose, status, agent_id')
      .eq('id', listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (!listing) throw new NotFoundException('This listing is no longer available.');
    if (listing.purpose !== opts.requiredPurpose || listing.status !== 'verified') {
      throw new BadRequestException(opts.ineligibleMessage);
    }
    if (!listing.agent_id) {
      throw new BadRequestException('This listing has no assigned agent to book the deal under.');
    }

    // The deal is always booked under the LISTING's own agent (not
    // necessarily the caller) — an agency admin closing a colleague's
    // listing still records it as that colleague's deal, matching "which
    // staff member closed which deal" from the per-agent revenue breakdown.
    const dealAgentId: string = listing.agent_id;
    await this.assertCanCloseListing(caller, dealAgentId);

    const { agencyId, defaultCommissionRate } = await this.getAgentAgencyContext(dealAgentId);
    const commissionRate = opts.commissionRate ?? defaultCommissionRate ?? PLATFORM_DEFAULT_COMMISSION_RATE;
    const commissionAmount = (opts.amount * commissionRate) / 100;

    const { data: deal, error: dealError } = await this.supabase.client
      .from('deals')
      .insert({
        listing_id: listingId,
        agent_id: dealAgentId,
        agency_id: agencyId,
        deal_type: opts.dealType,
        amount: opts.amount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        closed_at: opts.closedAt ?? new Date().toISOString().slice(0, 10),
        notes: opts.notes,
        created_by: caller.id,
      })
      .select('id, listing_id, agent_id, agency_id, deal_type, amount, commission_rate, commission_amount, closed_at, notes, created_at')
      .single();
    if (dealError) throw dealError;

    const { data: listingRow, error: updateError } = await this.supabase.client
      .from('listings')
      .update({ status: opts.newStatus })
      .eq('id', listingId)
      .select('id, status')
      .single();
    if (updateError) throw updateError;

    return {
      deal: {
        id: deal.id,
        listingId: deal.listing_id,
        agentId: deal.agent_id,
        agencyId: deal.agency_id,
        dealType: deal.deal_type,
        amount: deal.amount,
        commissionRate: deal.commission_rate,
        commissionAmount: deal.commission_amount,
        closedAt: deal.closed_at,
        notes: deal.notes,
        createdAt: deal.created_at,
      },
      listing: { id: listingRow.id, status: listingRow.status },
    };
  }

  // Books a deals row from a WON opportunity (services/api/src/opportunities/
  // opportunities.repository.ts::updateStage()) — reuses the exact same
  // commission-rate resolution as markSold/markRented (agency default,
  // falling back to PLATFORM_DEFAULT_COMMISSION_RATE) rather than forking
  // that math into the opportunities module or into SQL. Unlike markClosed
  // above, this never touches a listing's status — an opportunity isn't
  // necessarily tied 1:1 to a single listing's lifecycle the way "Mark
  // Sold" is, so the caller (OpportunitiesRepository) owns deciding whether
  // a listing status change is also warranted.
  async createFromOpportunity(input: {
    opportunityId: string;
    listingId: string;
    agentId: string;
    dealType: 'sale' | 'rent';
    amount: number;
    commissionRate?: number;
    notes?: string;
    closedAt?: string;
    createdBy: string;
  }) {
    const { agencyId, defaultCommissionRate } = await this.getAgentAgencyContext(input.agentId);
    const commissionRate = input.commissionRate ?? defaultCommissionRate ?? PLATFORM_DEFAULT_COMMISSION_RATE;
    const commissionAmount = (input.amount * commissionRate) / 100;

    const { data: deal, error } = await this.supabase.client
      .from('deals')
      .insert({
        listing_id: input.listingId,
        agent_id: input.agentId,
        agency_id: agencyId,
        deal_type: input.dealType,
        amount: input.amount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        closed_at: input.closedAt ?? new Date().toISOString().slice(0, 10),
        notes: input.notes,
        created_by: input.createdBy,
        opportunity_id: input.opportunityId,
      })
      .select(
        'id, listing_id, agent_id, agency_id, deal_type, amount, commission_rate, commission_amount, closed_at, notes, created_at, opportunity_id',
      )
      .single();
    if (error) throw error;
    return deal;
  }

  // Server-side paginated deal ledger — same "count: 'exact' + range()"
  // pattern as LeadsRepository.list/ListingsRepository.findMine.
  async list(caller: AuthenticatedUser, filters: DealListFilters) {
    const pagination = resolvePagination(filters);

    let query = this.supabase.client
      .from('deals')
      .select(DEAL_LIST_COLUMNS, { count: 'exact' })
      .order('closed_at', { ascending: false });

    if (caller.role !== 'super_admin') {
      const agencyStaffIds = filters.scope === 'agency' ? await this.getSameAgencyAgentIds(caller.agentId) : null;
      if (agencyStaffIds) {
        query = query.in('agent_id', agencyStaffIds);
      } else {
        query = query.eq('agent_id', caller.agentId);
      }
    }
    if (filters.dealType) query = query.eq('deal_type', filters.dealType);
    if (filters.dateFrom) query = query.gte('closed_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('closed_at', filters.dateTo);
    query = query.range(pagination.from, pagination.to);

    const page = await paginate(query, pagination);
    return {
      ...page,
      items: page.items.map((row: any) => ({
        id: row.id,
        listingId: row.listing_id,
        listingTitle: row.listings?.title ?? null,
        agentId: row.agent_id,
        agentName: row.agent_profiles?.display_name ?? null,
        dealType: row.deal_type,
        amount: row.amount,
        commissionRate: row.commission_rate,
        commissionAmount: row.commission_amount,
        closedAt: row.closed_at,
        notes: row.notes,
        createdAt: row.created_at,
      })),
    };
  }

  // Aggregates commission_amount off the deals table, bucketed by the
  // requested period — mirrors AgentsRepository.getAnalytics/
  // getListingsAnalytics's own style (aggregated in-memory over the
  // matching rows; supabase-js has no native GROUP BY), summing money
  // instead of counting engagement rows. scope='agency' is honored only
  // when the target agent is actually an agency admin, same "ignored, not
  // rejected" discipline as every other scope filter in this codebase.
  async getRevenue(agentId: string, caller: AuthenticatedUser, filters: RevenueFilters) {
    await this.assertCanViewAgentRevenue(caller, agentId);

    const agencyStaffIds = filters.scope === 'agency' ? await this.getSameAgencyAgentIds(agentId) : null;
    const agentIds = agencyStaffIds ?? [agentId];

    return this.aggregateRevenue(agentIds, filters.period, !!agencyStaffIds);
  }

  // Super Admin-only (enforced at the controller — no per-row ownership
  // check needed here, unlike getRevenue above, since this route isn't
  // exposed to agent/agency-admin roles at all). Closes the "agency
  // revenue needs an anchor agentId" gap: resolves the agency's own staff
  // directly by agency_id instead of requiring the caller to already know
  // one of its agent ids and pass scope='agency' against it.
  async getAgencyRevenue(agencyId: string, filters: RevenueFilters) {
    const { data: staff, error } = await this.supabase.client.from('agent_profiles').select('id').eq('agency_id', agencyId);
    if (error) throw error;
    const agentIds = (staff ?? []).map((row: any) => row.id as string);

    return this.aggregateRevenue(agentIds, filters.period, true);
  }

  // Shared aggregation behind getRevenue/getAgencyRevenue — mirrors
  // AgentsRepository.getAnalytics/getListingsAnalytics's own style
  // (aggregated in-memory over the matching rows; supabase-js has no
  // native GROUP BY), summing money instead of counting engagement rows.
  private async aggregateRevenue(agentIds: string[], period: RevenuePeriod, includeByAgent: boolean) {
    const { data: rows, error } =
      agentIds.length === 0
        ? { data: [] as any[], error: null }
        : await this.supabase.client.from('deals').select('agent_id, commission_amount, closed_at').in('agent_id', agentIds);
    if (error) throw error;

    const byPeriod = new Map<string, { revenue: number; dealCount: number }>();
    const byAgent = new Map<string, { revenue: number; dealCount: number }>();
    let totalRevenue = 0;
    let dealCount = 0;

    for (const row of rows ?? []) {
      const amount = Number((row as any).commission_amount);
      const bucketedPeriod = bucketPeriod((row as any).closed_at, period);
      const rowAgentId = (row as any).agent_id as string;

      totalRevenue += amount;
      dealCount++;

      const periodBucket = byPeriod.get(bucketedPeriod) ?? { revenue: 0, dealCount: 0 };
      periodBucket.revenue += amount;
      periodBucket.dealCount++;
      byPeriod.set(bucketedPeriod, periodBucket);

      const agentBucket = byAgent.get(rowAgentId) ?? { revenue: 0, dealCount: 0 };
      agentBucket.revenue += amount;
      agentBucket.dealCount++;
      byAgent.set(rowAgentId, agentBucket);
    }

    const result: {
      totalRevenue: number;
      dealCount: number;
      byPeriod: { period: string; revenue: number; dealCount: number }[];
      byAgent?: { agentId: string; displayName: string | null; revenue: number; dealCount: number }[];
    } = {
      totalRevenue,
      dealCount,
      byPeriod: Array.from(byPeriod, ([bucketedPeriod, v]) => ({ period: bucketedPeriod, ...v })).sort((a, b) =>
        a.period.localeCompare(b.period),
      ),
    };

    if (includeByAgent) {
      const displayNames = await this.getStaffDisplayNames(agentIds);
      result.byAgent = agentIds.map((id) => ({
        agentId: id,
        displayName: displayNames.get(id) ?? null,
        revenue: byAgent.get(id)?.revenue ?? 0,
        dealCount: byAgent.get(id)?.dealCount ?? 0,
      }));
    }

    return result;
  }

  // Returns every agent_profiles.id sharing callerAgentId's agency, or null
  // if the caller isn't an agency admin (or has no agency) — copied rather
  // than shared from ListingsRepository/LeadsRepository's identical helper
  // (same "copied rather than shared" call made there, to avoid a
  // cross-module dependency for one small lookup; keep all three in sync if
  // the agency-admin resolution rule ever changes).
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

  // Auth gate for markSold/markRented — caller must be the listing's own
  // agent, that listing's agency admin (via getSameAgencyAgentIds), or
  // super_admin. Same shape as ListingsRepository.assertCanAccessListingAnalytics.
  private async assertCanCloseListing(caller: AuthenticatedUser, dealAgentId: string): Promise<void> {
    if (caller.role === 'super_admin') return;
    if (caller.agentId === dealAgentId) return;

    const agencyStaffIds = await this.getSameAgencyAgentIds(caller.agentId);
    if (agencyStaffIds && agencyStaffIds.includes(dealAgentId)) return;

    throw new ForbiddenException('You do not have access to close this listing.');
  }

  // Auth gate for GET /agents/:id/revenue — own agent, that agent's agency
  // admin, or super_admin. Same shape as assertCanCloseListing above.
  private async assertCanViewAgentRevenue(caller: AuthenticatedUser, targetAgentId: string): Promise<void> {
    if (caller.role === 'super_admin') return;
    if (caller.agentId === targetAgentId) return;

    const agencyStaffIds = await this.getSameAgencyAgentIds(caller.agentId);
    if (agencyStaffIds && agencyStaffIds.includes(targetAgentId)) return;

    throw new ForbiddenException('You do not have access to this agent revenue.');
  }

  private async getAgentAgencyContext(agentId: string): Promise<{ agencyId: string | null; defaultCommissionRate: number | null }> {
    const { data: agent, error: agentError } = await this.supabase.client
      .from('agent_profiles')
      .select('agency_id')
      .eq('id', agentId)
      .maybeSingle();
    if (agentError) throw agentError;
    if (!agent?.agency_id) return { agencyId: null, defaultCommissionRate: null };

    const { data: agency, error: agencyError } = await this.supabase.client
      .from('agencies')
      .select('default_commission_rate')
      .eq('id', agent.agency_id)
      .maybeSingle();
    if (agencyError) throw agencyError;
    return { agencyId: agent.agency_id, defaultCommissionRate: agency?.default_commission_rate ?? null };
  }

  private async getStaffDisplayNames(agentIds: string[]): Promise<Map<string, string>> {
    if (agentIds.length === 0) return new Map();
    const { data, error } = await this.supabase.client.from('agent_profiles').select('id, display_name').in('id', agentIds);
    if (error) throw error;
    return new Map((data ?? []).map((row: any) => [row.id, row.display_name]));
  }
}
