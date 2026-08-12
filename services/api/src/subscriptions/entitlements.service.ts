import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface TierEntitlements {
  listingQuota: number;
  // Separate from listingQuota — a project is a much bigger undertaking
  // than a single listing, so it's priced/limited independently rather
  // than sharing the same counter. See getProjectUsage/canCreateProject.
  projectQuota: number;
  // Days a listing stays 'verified' before PlanLifecycleService's cron
  // expires it — null means unlimited. Also read by ListingsRepository.renew()
  // to recompute a fresh expiry the same way record_verification_action()
  // (supabase/migrations/0042_listing_expiration.sql) does on initial approval.
  listingDurationDays: number | null;
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
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw error;

    // Real correctness fix: previously any row (active, past_due, canceled
    // — whatever `status` said) was honored as long as one existed at all,
    // so an expired/canceled subscription kept granting full paid
    // entitlements forever. The .eq('status', 'active') above already
    // excludes past_due/canceled; this additionally excludes a row that's
    // still marked 'active' but whose period has quietly lapsed (defense
    // in depth alongside PlanLifecycleService's cron, which corrects
    // `status` itself on the same condition).
    const withinPeriod = !subscription?.current_period_end || subscription.current_period_end > new Date().toISOString();

    if (subscription && withinPeriod) {
      const tier = (subscription as any).subscription_tiers;
      return {
        listingQuota: tier.listing_quota,
        projectQuota: tier.project_quota,
        listingDurationDays: tier.listing_duration_days,
      };
    }

    return this.getDefaultEntitlements();
  }

  // No active, in-period subscription — never subscribed, or it lapsed.
  // Falls back to the real "Lite" plan's own numbers (single source of
  // truth — the same row the admin Plans page edits) rather than a
  // separate hardcoded default, so an unsubscribed agent's limits always
  // match exactly what the Lite plan card promises.
  private async getDefaultEntitlements(): Promise<TierEntitlements> {
    const { data: liteTier, error } = await this.supabase.client
      .from('subscription_tiers')
      .select('*')
      .eq('name', 'Lite')
      .maybeSingle();
    if (error) throw error;

    if (liteTier) {
      return {
        listingQuota: liteTier.listing_quota,
        projectQuota: liteTier.project_quota,
        listingDurationDays: liteTier.listing_duration_days,
      };
    }

    // Safety net only — reached if the Lite plan was ever deleted/renamed.
    return { listingQuota: 5, projectQuota: 0, listingDurationDays: 30 };
  }

  async getListingUsage(agentId: string): Promise<{ used: number; quota: number }> {
    const [entitlements, { count, error }] = await Promise.all([
      this.getEntitlements(agentId),
      // .neq('status', 'deleted')/.neq('status', 'expired') — without these,
      // a soft-deleted listing (ListingsController's remove() only ever sets
      // status: 'deleted', never a hard delete) or an expired one
      // (PlanLifecycleService's cron, now that listings actually expire —
      // see 0042_listing_expiration.sql) would count against quota forever,
      // contradicting the enforcement error's own "upgrade or free up a
      // slot" promise.
      this.supabase.client
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .neq('status', 'deleted')
        .neq('status', 'expired'),
    ]);
    if (error) throw error;
    return { used: count ?? 0, quota: entitlements.listingQuota };
  }

  async canCreateListing(agentId: string): Promise<boolean> {
    const { used, quota } = await this.getListingUsage(agentId);
    return used < quota;
  }

  // Mirrors getListingUsage above, with one difference: projects.created_by
  // stores the creator's auth user id (req.user.id), NOT their agent_profiles
  // id — confirmed by ProjectsController.assertOwnProject comparing
  // createdBy against req.user.id, never agentId. So the tier/quota lookup
  // stays keyed on agentId (same as listings), but the row-count is keyed on
  // userId to actually match what's stored in the projects table.
  async getProjectUsage(agentId: string, userId: string): Promise<{ used: number; quota: number }> {
    const [entitlements, { count, error }] = await Promise.all([
      this.getEntitlements(agentId),
      this.supabase.client
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId),
    ]);
    if (error) throw error;
    return { used: count ?? 0, quota: entitlements.projectQuota };
  }

  async canCreateProject(agentId: string, userId: string): Promise<boolean> {
    const { used, quota } = await this.getProjectUsage(agentId, userId);
    return used < quota;
  }
}
