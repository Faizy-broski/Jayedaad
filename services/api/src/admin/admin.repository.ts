import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

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
    const [usersRes, agenciesRes, listingsRes, leadsRes, subscriptionsRes] = await Promise.all([
      this.supabase.client.from('profiles').select('role'),
      this.supabase.client.from('agencies').select('verification_status'),
      this.supabase.client.from('listings').select('status'),
      this.supabase.client.from('leads').select('status'),
      this.supabase.client.from('subscriptions').select('tier_id, subscription_tiers (name)').eq('status', 'active'),
    ]);
    if (usersRes.error) throw usersRes.error;
    if (agenciesRes.error) throw agenciesRes.error;
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
      listingsByStatus: countBy(listingsRes.data ?? [], 'status'),
      leadsByStatus: countBy(leadsRes.data ?? [], 'status'),
      activeSubscriptionsByTier: byTierName,
    };
  }

  // The actual "see all agents' insights at a glance" ask — one row per
  // agent joining profile + agency + listing counts + subscription tier.
  // Nothing else in the codebase rolls agents up across the whole platform.
  async listAgentsOverview() {
    const { data: agents, error: agentsError } = await this.supabase.client
      .from('agent_profiles')
      .select(
        'id, display_name, phone, city, verification_status, agencies (id, name, slug), subscriptions (status, current_period_end, subscription_tiers (name))',
      )
      .order('created_at', { ascending: false });
    if (agentsError) throw agentsError;

    const agentIds = (agents ?? []).map((a: any) => a.id);
    if (agentIds.length === 0) return [];

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

    return (agents ?? []).map((agent: any) => ({
      id: agent.id,
      displayName: agent.display_name,
      phone: agent.phone,
      city: agent.city,
      verificationStatus: agent.verification_status,
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
  }
}
