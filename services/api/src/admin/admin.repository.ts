import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { paginate, PaginationParams, resolvePagination, sanitizeKeyword } from '../common/pagination';

function countBy(rows: any[], key: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const value = row[key] as string;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

@Injectable()
export class AdminRepository {
  constructor(private readonly supabase: SupabaseService) {}

  // The platform-wide rollup nothing so far provides — every other stats
  // endpoint this session is scoped to one agent/agency (AgentsRepository/
  // AgenciesRepository.getStats()). Computed at query time, same discipline
  // as those, not a stored/cached figure.
  async getPlatformStats() {
    const [usersRes, agenciesRes, agentsRes, listingsRes, leadsRes, subscriptionsRes] = await Promise.all([
      this.supabase.client.from('profiles').select('role'),
      this.supabase.client.from('agencies').select('verification_status'),
      this.supabase.client.from('agent_profiles').select('verification_status'),
      this.supabase.client.from('listings').select('status'),
      this.supabase.client.from('leads').select('status'),
      this.supabase.client.from('subscriptions').select('tier_id, subscription_tiers (name)').eq('status', 'active'),
    ]);
    if (usersRes.error) throw usersRes.error;
    if (agenciesRes.error) throw agenciesRes.error;
    if (agentsRes.error) throw agentsRes.error;
    if (listingsRes.error) throw listingsRes.error;
    if (leadsRes.error) throw leadsRes.error;
    if (subscriptionsRes.error) throw subscriptionsRes.error;

    const byTierName: Record<string, number> = {};
    for (const row of subscriptionsRes.data ?? []) {
      const name = (row as any).subscription_tiers?.name ?? 'Unknown';
      byTierName[name] = (byTierName[name] ?? 0) + 1;
    }

    return {
      usersByRole: countBy(usersRes.data ?? [], 'role'),
      agenciesByVerificationStatus: countBy(agenciesRes.data ?? [], 'verification_status'),
      agentsByVerificationStatus: countBy(agentsRes.data ?? [], 'verification_status'),
      listingsByStatus: countBy(listingsRes.data ?? [], 'status'),
      leadsByStatus: countBy(leadsRes.data ?? [], 'status'),
      activeSubscriptionsByTier: byTierName,
    };
  }

  // The actual "see all agents' insights at a glance" ask — one row per
  // agent joining profile + agency + listing counts + subscription tier.
  // Nothing else in the codebase rolls agents up across the whole platform.
  // Dual-mode: called with no page/pageSize, this returns the full
  // unpaginated array exactly as before — needed by callers that use it as
  // unbounded reference data (CRM's "All agents"/"Reassign to…" dropdowns).
  // Called with page and/or pageSize, it paginates and returns
  // { items, total, page, pageSize } for the Agents admin table. See
  // services/api/src/common/pagination.ts and the pagination-unification
  // plan for why this one endpoint deliberately has two response shapes.
  async listAgentsOverview(
    filters: PaginationParams & { search?: string; verificationStatus?: string; reviewableOnly?: boolean } = {},
  ) {
    const paginated = filters.page != null || filters.pageSize != null;
    const pagination = paginated ? resolvePagination(filters) : null;

    let agentsQuery = this.supabase.client
      .from('agent_profiles')
      .select(
        'id, user_id, display_name, phone, city, verification_status, is_agency_admin, agencies (id, name, slug), subscriptions (status, current_period_end, subscription_tiers (name))',
        pagination ? { count: 'exact' } : undefined,
      )
      .order('created_at', { ascending: false });

    // Filters below only ever apply on the paginated (admin table) branch —
    // the unpaginated branch stays a plain unfiltered roster, matching every
    // other unbounded reference-data caller's expectation.
    if (pagination) {
      // A row added through an agency admin's "Agency Staff" screen needs no
      // individual identity verification of its own — the agency's own
      // review already covers it. Only independent agents and the one admin
      // who registered/owns each agency go through this table.
      if (filters.reviewableOnly) agentsQuery = agentsQuery.or('agency_id.is.null,is_agency_admin.eq.true');
      if (filters.verificationStatus) agentsQuery = agentsQuery.eq('verification_status', filters.verificationStatus);
      if (filters.search) {
        const term = sanitizeKeyword(filters.search);
        if (term) agentsQuery = agentsQuery.or(`display_name.ilike.%${term}%,city.ilike.%${term}%`);
      }
      agentsQuery = agentsQuery.range(pagination.from, pagination.to);
    }

    const { data: agents, error: agentsError, count } = await agentsQuery;
    if (agentsError) throw agentsError;

    const agentIds = (agents ?? []).map((a: any) => a.id);
    const mapped =
      agentIds.length === 0
        ? []
        : await (async () => {
            const { data: listingRows, error: listingsError } = await this.supabase.client
              .from('listings')
              .select('agent_id, status')
              .in('agent_id', agentIds);
            if (listingsError) throw listingsError;

            const listingCountsByAgent = new Map<string, { total: number; verified: number }>();
            for (const row of listingRows ?? []) {
              const agentId = (row as any).agent_id as string;
              const entry = listingCountsByAgent.get(agentId) ?? { total: 0, verified: 0 };
              entry.total++;
              if ((row as any).status === 'verified') entry.verified++;
              listingCountsByAgent.set(agentId, entry);
            }

            // display_name can be NULL (a real signup-path gap — see
            // 0055_default_signup_role_agent.sql) — every consumer of this
            // roster (CRM's agent picker/reassign dropdown, attribution
            // labels) previously fell back to the raw agent_profiles.id
            // when it was, showing a bare UUID in the UI instead of
            // anything human-readable. email is always present (every
            // signup path uses email/password or an OAuth email), so it's
            // a real fallback source — packages/core's resolveDisplayName
            // helper is what actually applies the fallback order.
            const userIds = (agents ?? []).map((a: any) => a.user_id).filter(Boolean);
            const { data: profileRows, error: profilesError } =
              userIds.length === 0
                ? { data: [] as any[], error: null }
                : await this.supabase.client.from('profiles').select('id, email, role').in('id', userIds);
            if (profilesError) throw profilesError;
            const emailByUserId = new Map((profileRows ?? []).map((row: any) => [row.id, row.email as string]));
            // A super_admin can carry a leftover agent_profiles row (e.g. from
            // before being promoted) — exclude them from every agent roster
            // consumer (CRM picker, reassign dropdown, Agents admin table) so
            // the platform owner never shows up as a selectable "agent".
            const roleByUserId = new Map((profileRows ?? []).map((row: any) => [row.id, row.role as string]));

            return (agents ?? [])
              .filter((agent: any) => roleByUserId.get(agent.user_id) !== 'super_admin')
              .map((agent: any) => ({
              id: agent.id,
              displayName: agent.display_name,
              email: emailByUserId.get(agent.user_id) ?? null,
              phone: agent.phone,
              city: agent.city,
              verificationStatus: agent.verification_status,
              isAgencyAdmin: agent.is_agency_admin,
              agency: agent.agencies ? { id: agent.agencies.id, name: agent.agencies.name, slug: agent.agencies.slug } : null,
              subscription: agent.subscriptions
                ? {
                    status: agent.subscriptions.status,
                    currentPeriodEnd: agent.subscriptions.current_period_end,
                    tierName: agent.subscriptions.subscription_tiers?.name ?? null,
                  }
                : null,
              listingCounts: listingCountsByAgent.get(agent.id) ?? { total: 0, verified: 0 },
            }));
          })();

    if (!pagination) return mapped;
    return { items: mapped, total: count ?? 0, page: pagination.page, pageSize: pagination.pageSize };
  }

  // Admin-scoped agency roster — every status (pending/verified/rejected),
  // unlike AgenciesRepository.list() (GET /agencies, @Public()) which
  // hardcodes .eq('verification_status', 'verified') for the buyer-facing
  // "browse agencies" directory. The Super Admin Agencies page was wrongly
  // reusing that public endpoint, so a still-pending/rejected agency (e.g.
  // one created via self-service signup) never showed up there at all —
  // "0 registered agencies" even while its staff appeared correctly on the
  // Agents roster above.
  // Dual-mode, same convention as listAgentsOverview above: called with no
  // page/pageSize, returns the full unpaginated array (needed by the CRM
  // agent/agency picker's unbounded "every agency" list — previously this
  // method always paginated and hard-capped at MAX_PAGE_SIZE=100, which
  // would have silently truncated that list past 100 agencies). Called
  // with page and/or pageSize (the Agencies admin table), it paginates as
  // before.
  async listAgenciesOverview(
    filters: PaginationParams & { search?: string; verificationStatus?: string } = {},
  ) {
    const paginated = filters.page != null || filters.pageSize != null;

    let query = this.supabase.client
      .from('agencies')
      .select(
        'id, name, slug, logo_url, description, phone, email, city, address, business_hours, verification_status, sales_associate_count, default_commission_rate',
        paginated ? { count: 'exact' } : undefined,
      )
      .order('name', { ascending: true });

    if (filters.verificationStatus) query = query.eq('verification_status', filters.verificationStatus);
    if (filters.search) {
      const term = sanitizeKeyword(filters.search);
      if (term) query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%`);
    }

    if (!paginated) {
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }

    const pagination = resolvePagination(filters);
    query = query.range(pagination.from, pagination.to);
    return paginate(query, pagination);
  }
}
