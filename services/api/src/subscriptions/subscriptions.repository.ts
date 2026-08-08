import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';

// The literal fix for "Current Plan: -" showing blank on the real Profolio
// dashboard screenshot from an earlier pass — nothing ever wrote to
// `subscriptions` until this method existed.
@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async assign(agentId: string, input: AssignSubscriptionDto) {
    const { data, error } = await this.supabase.client
      .from('subscriptions')
      .upsert(
        {
          agent_id: agentId,
          tier_id: input.tierId,
          status: 'active',
          current_period_end: input.currentPeriodEnd,
        },
        { onConflict: 'agent_id' },
      )
      .select('*, subscription_tiers (*)')
      .single();
    if (error) throw error;
    await this.grantPeriodCredits(agentId, input.tierId);
    return data;
  }

  // Tops up agent_credits' hot/super_hot balances to the tier's own
  // hot_credits_per_period/super_hot_credits_per_period allotment — called
  // on every (re-)selection of a tier (assign/assignFromStripeCheckout) and
  // on each successful recurring payment (webhook's invoice.payment_succeeded).
  // `total` is SET to the allotment, not incremented — this models "N
  // credits per period", not an ever-growing stockpile; `used` resets to 0
  // so a fresh period always starts with the full allotment available,
  // matching how the plan's featured-listing rules are described on the
  // Plan page.
  private async grantPeriodCredits(agentId: string, tierId: string): Promise<void> {
    const tier = await this.findTierById(tierId);
    if (!tier) return;

    const grants: { credit_type: 'hot' | 'super_hot'; total: number }[] = [
      { credit_type: 'hot', total: tier.hot_credits_per_period ?? 0 },
      { credit_type: 'super_hot', total: tier.super_hot_credits_per_period ?? 0 },
    ];

    const { error } = await this.supabase.client.from('agent_credits').upsert(
      grants.map((g) => ({ agent_id: agentId, credit_type: g.credit_type, total: g.total, used: 0 })),
      { onConflict: 'agent_id,credit_type' },
    );
    if (error) throw error;
  }

  async findForAgent(agentId: string) {
    const { data, error } = await this.supabase.client
      .from('subscriptions')
      .select('*, subscription_tiers (*)')
      .eq('agent_id', agentId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  // Written only by the Stripe webhook (subscriptions.controller.ts's
  // `webhook` route) on checkout.session.completed — the paid-tier
  // counterpart to assign() above, which stays reserved for free tiers.
  async assignFromStripeCheckout(input: {
    agentId: string;
    tierId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    currentPeriodEnd?: string;
  }) {
    const { data, error } = await this.supabase.client
      .from('subscriptions')
      .upsert(
        {
          agent_id: input.agentId,
          tier_id: input.tierId,
          status: 'active',
          current_period_end: input.currentPeriodEnd,
          stripe_customer_id: input.stripeCustomerId,
          stripe_subscription_id: input.stripeSubscriptionId,
        },
        { onConflict: 'agent_id' },
      )
      .select('*, subscription_tiers (*)')
      .single();
    if (error) throw error;
    await this.grantPeriodCredits(input.agentId, input.tierId);
    return data;
  }

  // customer.subscription.updated/deleted webhook events — status changes
  // (past_due, canceled, ...) on a subscription that already went through
  // checkout once. Looked up by Stripe's own subscription id, not agent_id,
  // since the webhook payload only carries the former.
  async updateStatusByStripeSubscriptionId(
    stripeSubscriptionId: string,
    status: string,
    currentPeriodEnd?: string,
    cancelAtPeriodEnd?: boolean,
  ) {
    const { error } = await this.supabase.client
      .from('subscriptions')
      .update({ status, current_period_end: currentPeriodEnd, cancel_at_period_end: cancelAtPeriodEnd })
      .eq('stripe_subscription_id', stripeSubscriptionId);
    if (error) throw error;
  }

  // invoice.payment_succeeded (billing_reason: subscription_cycle) is the
  // real "a new period started and was paid for" signal — unlike
  // customer.subscription.updated, which fires on many unrelated changes
  // too. Looked up by Stripe's subscription id, same as
  // updateStatusByStripeSubscriptionId, since that's all the webhook
  // payload carries.
  async grantRenewalCredits(stripeSubscriptionId: string): Promise<void> {
    const { data: subscription, error } = await this.supabase.client
      .from('subscriptions')
      .select('agent_id, tier_id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();
    if (error) throw error;
    if (!subscription) return;
    await this.grantPeriodCredits(subscription.agent_id, subscription.tier_id);
  }

  async findTierById(tierId: string) {
    const { data, error } = await this.supabase.client.from('subscription_tiers').select('*').eq('id', tierId).maybeSingle();
    if (error) throw error;
    return data;
  }

  // Stripe Checkout wants an email to prefill/attach to the Customer it
  // creates — profiles.email is always populated (every signup path uses
  // email/password, per its own table comment), no separate lookup module
  // needed for this one field.
  async findEmailForUser(userId: string): Promise<string | undefined> {
    const { data, error } = await this.supabase.client.from('profiles').select('email').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data?.email;
  }
}
