import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface TierEntitlements {
  listingQuota: number;
  analyticsDepth: 'basic' | 'standard' | 'advanced' | 'full';
  viewCountDetail: 'total_only' | 'breakdown_by_source' | 'full_timeseries';
}

// Independent entitlement layer per [Dev Instr §2.3]: "can be adjusted
// independently of the core CRM logic as tiers are finalized." Reads tier
// config from the DB — changing entitlements is a data change, not a deploy.
// Crucially: this NEVER recomputes or duplicates the underlying count in
// `listing_engagement_events` — it only gates how much of the one true number is exposed,
// which is what keeps [Reqs §4.3] parity intact.
@Injectable()
export class EntitlementsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getEntitlements(agentId: string): Promise<TierEntitlements> {
    const { data: subscription, error } = await this.supabase.client
      .from('subscriptions')
      .select('*, subscription_tiers(*)')
      .eq('agent_id', agentId)
      .maybeSingle();
    if (error) throw error;

    if (!subscription) {
      // No active subscription: treat as the free "lite" tier defaults.
      return { listingQuota: 50, analyticsDepth: 'basic', viewCountDetail: 'total_only' };
    }

    const tier = (subscription as any).subscription_tiers;
    return {
      listingQuota: tier.listing_quota,
      ...(tier.analytics_depth as Omit<TierEntitlements, 'listingQuota'>),
    };
  }

  async getListingUsage(agentId: string): Promise<{ used: number; quota: number }> {
    const [entitlements, { count, error }] = await Promise.all([
      this.getEntitlements(agentId),
      this.supabase.client.from('listings').select('id', { count: 'exact', head: true }).eq('agent_id', agentId),
    ]);
    if (error) throw error;
    return { used: count ?? 0, quota: entitlements.listingQuota };
  }

  async canCreateListing(agentId: string): Promise<boolean> {
    const { used, quota } = await this.getListingUsage(agentId);
    return used < quota;
  }
}
