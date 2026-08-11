import { BadRequestException, Body, Controller, Get, Logger, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { ScopeGuard } from '../common/guards/scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { EntitlementsService } from './entitlements.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { StripeService } from './stripe.service';
import { CreditPacksRepository } from './credit-packs.repository';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutCreditPackDto } from './dto/checkout-credit-pack.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly entitlements: EntitlementsService,
    private readonly subscriptions: SubscriptionsRepository,
    private readonly stripe: StripeService,
    private readonly creditPacks: CreditPacksRepository,
  ) {}

  // "40 of 50 listings used" — real-time usage tracking [Spec §6/§8.1].
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get('usage')
  usage(@Req() req: any) {
    return this.entitlements.getListingUsage(req.user.agentId);
  }

  // The agent's own current plan — findForAgent() already existed but was
  // never wired to a route (Current Plan showed a hardcoded "-" on the
  // dashboard because nothing ever fetched this).
  @UseGuards(ScopeGuard)
  @Roles('agent', 'super_admin')
  @Get('me')
  me(@Req() req: any) {
    return this.subscriptions.findForAgent(req.user.agentId);
  }

  // Self-service, instant, no payment — kept for free tiers only
  // (price = 0). A real Stripe account didn't exist when this endpoint was
  // first built, so it let ANY tier be self-granted for free; that gap is
  // what checkout() below closes for paid tiers, without touching this
  // route's behavior for the free plan.
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post('me/select')
  async select(@Req() req: any, @Body() body: AssignSubscriptionDto) {
    const tier = await this.subscriptions.findTierById(body.tierId);
    if (!tier) throw new BadRequestException('Unknown subscription tier.');
    if (Number(tier.price) > 0) {
      throw new BadRequestException('This is a paid tier — use POST /subscriptions/me/checkout instead.');
    }
    return this.subscriptions.assign(req.user.agentId, body);
  }

  // Real payment collection for paid tiers — creates a Stripe Checkout
  // Session and hands the client a redirect URL. The `subscriptions` row
  // itself is only ever written by the webhook below, once Stripe confirms
  // payment actually happened (checkout.session.completed), never
  // optimistically here.
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post('me/checkout')
  async checkout(@Req() req: any, @Body() body: CreateCheckoutSessionDto) {
    const tier = await this.subscriptions.findTierById(body.tierId);
    if (!tier) throw new BadRequestException('Unknown subscription tier.');
    if (Number(tier.price) === 0) {
      throw new BadRequestException('This is a free tier — use POST /subscriptions/me/select instead.');
    }
    if (!tier.stripe_price_id) {
      throw new BadRequestException('This tier has no Stripe price configured yet — contact support.');
    }

    const email = (await this.subscriptions.findEmailForUser(req.user.id)) ?? undefined;
    // Mobile passes its own jayedaad:// returnUrl (validated by the DTO's
    // scheme check) so Stripe redirects back into the app instead of the
    // web dashboard — falls back to today's web default when absent.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const base = body.returnUrl ?? `${siteUrl}/dashboard/plan`;

    const session = await this.stripe.createCheckoutSession({
      priceId: tier.stripe_price_id,
      customerEmail: email ?? '',
      clientReferenceId: req.user.agentId,
      metadata: { agentId: req.user.agentId, tierId: tier.id },
      successUrl: `${base}?checkout=success`,
      cancelUrl: `${base}?checkout=cancelled`,
    });

    return { url: session.url };
  }

  // Standalone credit top-up — a one-time purchase (mode: 'payment'), not a
  // recurring plan, so it goes through StripeService.createOneTimeCheckoutSession
  // rather than checkout() above. agent_credits itself is only ever
  // incremented by the webhook below once Stripe confirms payment, same
  // "webhook is the only writer" discipline as the subscription checkout.
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post('me/credits/checkout')
  async creditsCheckout(@Req() req: any, @Body() body: CheckoutCreditPackDto) {
    const pack = await this.creditPacks.findById(body.packId);
    if (!pack || !pack.active) throw new BadRequestException('Unknown or inactive credit pack.');
    if (!pack.stripe_price_id) {
      throw new BadRequestException('This credit pack has no Stripe price configured yet — contact support.');
    }

    const email = (await this.subscriptions.findEmailForUser(req.user.id)) ?? undefined;
    // Same mobile deep-link convention as checkout() above.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const base = body.returnUrl ?? `${siteUrl}/dashboard/plan`;

    const session = await this.stripe.createOneTimeCheckoutSession({
      priceId: pack.stripe_price_id,
      customerEmail: email ?? '',
      clientReferenceId: req.user.agentId,
      metadata: { agentId: req.user.agentId, creditType: pack.credit_type, quantity: String(pack.quantity) },
      successUrl: `${base}?credits=success`,
      cancelUrl: `${base}?credits=cancelled`,
    });

    return { url: session.url };
  }

  // cancel_at_period_end via Stripe, not an immediate cutoff — the local
  // row's cancel_at_period_end/status get updated by the webhook's
  // customer.subscription.updated event once Stripe processes this, not
  // optimistically here (same "webhook is the only writer" discipline as
  // checkout above).
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post('me/cancel')
  async cancel(@Req() req: any) {
    const subscription = await this.subscriptions.findForAgent(req.user.agentId);
    if (!subscription?.stripe_subscription_id) {
      throw new BadRequestException('No active paid subscription to cancel.');
    }
    await this.stripe.cancelSubscription(subscription.stripe_subscription_id);
    return { cancelAtPeriodEnd: true };
  }

  // Stripe-hosted billing portal — invoice history, payment method update,
  // and Stripe's own cancel UI live there; this just mints the one-time
  // session URL. Requires the agent to have gone through checkout at least
  // once (a Stripe customer to attach the portal session to).
  @UseGuards(ScopeGuard)
  @Roles('agent')
  @Post('me/billing-portal')
  async billingPortal(@Req() req: any) {
    const subscription = await this.subscriptions.findForAgent(req.user.agentId);
    if (!subscription?.stripe_customer_id) {
      throw new BadRequestException('No billing account yet — subscribe to a paid plan first.');
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const session = await this.stripe.createBillingPortalSession(subscription.stripe_customer_id, `${siteUrl}/plan`);
    return { url: session.url };
  }

  // Stripe's webhook — the only place a `subscriptions` row is ever written
  // as a direct result of a paid checkout. @Public because Stripe calls
  // this with no user session, just its own HMAC signature
  // (Stripe-Signature header, verified against STRIPE_WEBHOOK_SECRET below)
  // — that signature check IS this route's auth.
  @Public()
  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string' || !req.rawBody) {
      throw new BadRequestException('Missing Stripe-Signature header or raw body.');
    }

    const event = this.stripe.constructEvent(req.rawBody, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Credit-pack top-ups go through createOneTimeCheckoutSession
        // (mode: 'payment') — distinguished here from a plan checkout
        // (mode: 'subscription') by session.mode, since both land on the
        // same event type. Handled first and returns early: a payment-mode
        // session never has session.subscription, so it wouldn't match the
        // tierId branch below anyway, but branching explicitly on mode
        // keeps the two flows from ever being confused as Stripe's payload
        // shape evolves.
        if (session.mode === 'payment') {
          const agentId = session.client_reference_id;
          const creditType = session.metadata?.creditType;
          const quantity = Number(session.metadata?.quantity);
          if (agentId && creditType && Number.isFinite(quantity) && quantity > 0) {
            await this.subscriptions.topUpCredits(agentId, creditType, quantity);
          } else {
            this.logger.warn(
              `checkout.session.completed (payment) missing required fields — session ${session.id}: agentId=${agentId} creditType=${creditType} quantity=${session.metadata?.quantity}`,
            );
          }
          break;
        }

        const agentId = session.client_reference_id;
        const tierId = session.metadata?.tierId;
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const stripeSubscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (agentId && tierId && stripeCustomerId && stripeSubscriptionId) {
          const subscription = await this.stripe.retrieveSubscription(stripeSubscriptionId);
          const currentPeriodEnd = subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : undefined;
          await this.subscriptions.assignFromStripeCheckout({
            agentId,
            tierId,
            stripeCustomerId,
            stripeSubscriptionId,
            currentPeriodEnd,
          });
        } else {
          // Shouldn't happen — checkout() above always sets
          // client_reference_id/metadata.tierId, and a subscription-mode
          // session always has a customer+subscription — but if it ever
          // does, a paid checkout would otherwise complete with NO plan
          // ever granted and zero trace of it anywhere. Stripe still gets
          // its 200 (retrying wouldn't fix a payload that's genuinely
          // missing fields), so this log is the only record.
          this.logger.warn(
            `checkout.session.completed missing required fields — session ${session.id}: agentId=${agentId} tierId=${tierId} customer=${stripeCustomerId} subscription=${stripeSubscriptionId}`,
          );
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const currentPeriodEnd = subscription.items.data[0]?.current_period_end
          ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
          : undefined;
        await this.subscriptions.updateStatusByStripeSubscriptionId(
          subscription.id,
          subscription.status,
          currentPeriodEnd,
          subscription.cancel_at_period_end,
        );
        break;
      }
      // The real "a new period started and was paid for" signal — fires on
      // every successful recurring charge, unlike customer.subscription.updated
      // (which fires on many unrelated changes too). Tops up the agent's
      // Hot/Super Hot credit allotment for the new period.
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Newer Stripe API versions (this SDK) moved the subscription
        // reference off the invoice's top level into parent.subscription_details.
        const subscriptionRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id;
        if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
          await this.subscriptions.grantRenewalCredits(subscriptionId);
        }
        break;
      }
      default:
        break; // Other event types aren't relevant to subscription state.
    }

    return { received: true };
  }

  // Super Admin assigns/changes an agent's plan — the write side that was
  // entirely missing; nothing ever populated `subscriptions` before this.
  // Deliberately bypasses payment (an internal override, e.g. comping a
  // plan), unlike the agent-facing routes above.
  @UseGuards(ScopeGuard)
  @Roles('super_admin')
  @Patch(':agentId/assign')
  assign(@Param('agentId') agentId: string, @Body() body: AssignSubscriptionDto) {
    return this.subscriptions.assign(agentId, body);
  }
}
