import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { SubscriptionsRepository } from './subscriptions.repository';

// Three "plan lifecycle" sweeps, grouped in one cron service the same way
// RemindersService is one job for one concern — these are related enough
// (all are time-based reversions tied to a subscription's billing period)
// to live together rather than as separate near-empty services.
//
// Talks to `subscriptions`/`listings` directly via SupabaseService, not
// through ListingsRepository — SubscriptionsModule deliberately doesn't
// import ListingsModule (which itself imports SubscriptionsModule for
// quota checks), so this stays a one-directional module dependency with no
// forwardRef() needed.
@Injectable()
export class PlanLifecycleService {
  private readonly logger = new Logger(PlanLifecycleService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly subscriptions: SubscriptionsRepository,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runLifecycleSweep(): Promise<void> {
    await this.expireLapsedSubscriptions();
    await this.revertExpiredBoosts();
    await this.revertExpiredStories();
    await this.revertExpiredProjectBoosts();
    await this.revertExpiredProjectStories();
    await this.expireListings();
    await this.dripAnnualCredits();
  }

  // Annual subscribers only get Stripe's invoice.payment_succeeded event
  // once a year (see subscriptions.controller.ts's webhook), which would
  // otherwise leave grantRenewalCredits() granting a full year's worth of
  // Hot/Super Hot/Refresh/Story credits just once instead of monthly like
  // every monthly subscriber gets. This re-runs the same per-period grant
  // for any active annual subscription whose credits haven't been topped up
  // in ~30 days — grantPeriodCredits SETS totals (doesn't accumulate), so
  // this behaves exactly like a fresh monthly period for them.
  private async dripAnnualCredits(): Promise<void> {
    const staleBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let due: { agent_id: string; tier_id: string }[] = [];
    try {
      due = await this.subscriptions.findActiveAnnualSubscriptionsDueForCredits(staleBefore);
    } catch (err) {
      this.logger.error('Failed to look up annual subscriptions due for a credit drip', err as Error);
      return;
    }
    for (const row of due) {
      try {
        await this.subscriptions.grantPeriodCredits(row.agent_id, row.tier_id);
        await this.subscriptions.markCreditsGranted(row.agent_id);
      } catch (err) {
        this.logger.error(`Failed to drip monthly credits for agent ${row.agent_id}`, err as Error);
      }
    }
    if (due.length) this.logger.log(`Dripped monthly credits for ${due.length} annual subscriber(s).`);
  }

  // Defense-in-depth for a missed/delayed Stripe webhook — EntitlementsService
  // already refuses to honor a subscription whose current_period_end has
  // passed regardless of what `status` says, so this isn't the only thing
  // standing between an expired subscription and continued paid access; it
  // just keeps `status` itself accurate for anything else that reads it
  // (the Plan page, admin views).
  private async expireLapsedSubscriptions(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString())
      .select('id');
    if (error) {
      this.logger.error('Failed to expire lapsed subscriptions', error as Error);
      return;
    }
    if (data?.length) this.logger.log(`Marked ${data.length} lapsed subscription(s) past_due.`);
  }

  // A spent Hot/Super Hot credit (ListingsRepository.boost()) sets
  // boost_expires_at ~30 days out — this is what actually reverts
  // boost_tier back to 'basic' once that window passes, so a single credit
  // doesn't permanently feature a listing forever.
  private async revertExpiredBoosts(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('listings')
      .update({ boost_tier: 'basic', boost_expires_at: null })
      .lt('boost_expires_at', new Date().toISOString())
      .select('id');
    if (error) {
      this.logger.error('Failed to revert expired listing boosts', error as Error);
      return;
    }
    if (data?.length) this.logger.log(`Reverted ${data.length} expired listing boost(s) to basic.`);
  }

  // A spent Story credit (ListingsRepository.postStory()) sets
  // story_expires_at ~24h out — clears it back to null once that window
  // passes. Unlike revertExpiredBoosts, there's no tier to revert to: a
  // Story placement is a plain on/off flag, not a rank.
  private async revertExpiredStories(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('listings')
      .update({ story_expires_at: null })
      .lt('story_expires_at', new Date().toISOString())
      .select('id');
    if (error) {
      this.logger.error('Failed to revert expired listing stories', error as Error);
      return;
    }
    if (data?.length) this.logger.log(`Reverted ${data.length} expired listing stor${data.length === 1 ? 'y' : 'ies'}.`);
  }

  // Same as revertExpiredBoosts, targeting `projects` instead — a spent
  // Hot/Super Hot credit (ProjectsRepository.boost(), spent from the SAME
  // shared agent_credits pool listings' boost draws from) sets
  // boost_expires_at ~30 days out.
  private async revertExpiredProjectBoosts(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('projects')
      .update({ boost_tier: 'basic', boost_expires_at: null })
      .lt('boost_expires_at', new Date().toISOString())
      .select('id');
    if (error) {
      this.logger.error('Failed to revert expired project boosts', error as Error);
      return;
    }
    if (data?.length) this.logger.log(`Reverted ${data.length} expired project boost(s) to basic.`);
  }

  // Same as revertExpiredStories, targeting `projects` instead.
  private async revertExpiredProjectStories(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('projects')
      .update({ story_expires_at: null })
      .lt('story_expires_at', new Date().toISOString())
      .select('id');
    if (error) {
      this.logger.error('Failed to revert expired project stories', error as Error);
      return;
    }
    if (data?.length) this.logger.log(`Reverted ${data.length} expired project stor${data.length === 1 ? 'y' : 'ies'}.`);
  }

  // expires_at is set on approval/renewal (record_verification_action() in
  // 0042_listing_expiration.sql, and ListingsRepository.renew()) from the
  // assigned agent's plan's listing_duration_days — null there means
  // unlimited, so it's simply never matched by this .lt() and never expires
  // via this sweep. Only 'verified' listings are targeted — a listing
  // already moved on to another terminal state (deleted, downgraded, ...)
  // shouldn't be silently relabeled 'expired' out from under it.
  private async expireListings(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('listings')
      .update({ status: 'expired' })
      .eq('status', 'verified')
      .lt('expires_at', new Date().toISOString())
      .select('id');
    if (error) {
      this.logger.error('Failed to expire listings', error as Error);
      return;
    }
    if (data?.length) this.logger.log(`Expired ${data.length} listing(s) past their plan's listing duration.`);
  }
}
