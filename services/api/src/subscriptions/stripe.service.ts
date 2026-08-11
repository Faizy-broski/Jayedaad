import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import Stripe from 'stripe';

// Wraps the Stripe SDK, gated on STRIPE_SECRET_KEY actually being set — no
// Stripe account exists yet as of this pass. Unlike Sentry/saved-search
// alerts (which are fine staying silently inert without credentials), a
// payment flow must never pretend to succeed: every method here throws a
// clear error instead of silently no-op-ing when Stripe isn't configured.
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | undefined;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      this.client = new Stripe(secretKey);
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set — paid-tier checkout will reject with a clear 500, not silently succeed.');
    }
  }

  get isConfigured(): boolean {
    return !!this.client;
  }

  private require(): Stripe {
    if (!this.client) {
      throw new InternalServerErrorException(
        'Payment collection is not configured yet (STRIPE_SECRET_KEY unset) — this tier cannot be checked out until it is.',
      );
    }
    return this.client;
  }

  async createCheckoutSession(params: {
    priceId: string;
    customerEmail: string;
    clientReferenceId: string;
    metadata: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.require().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: params.priceId, quantity: 1 }],
      customer_email: params.customerEmail,
      client_reference_id: params.clientReferenceId,
      metadata: params.metadata,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  // Standalone credit top-up purchases — mode: 'payment', not 'subscription',
  // since a credit pack is a one-off charge, not a recurring plan. The
  // webhook branches on session.mode to tell the two apart (see
  // SubscriptionsController.webhook()).
  async createOneTimeCheckoutSession(params: {
    priceId: string;
    customerEmail: string;
    clientReferenceId: string;
    metadata: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.require().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: params.priceId, quantity: 1 }],
      customer_email: params.customerEmail,
      client_reference_id: params.clientReferenceId,
      metadata: params.metadata,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  // Raw body (Buffer) required — Stripe's signature check hashes the exact
  // bytes received, which is why main.ts carves out a raw-body exception
  // for this one route instead of using the global JSON body parser.
  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET not set — cannot verify webhook signatures.');
    }
    return this.require().webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.require().subscriptions.retrieve(subscriptionId);
  }

  // cancel_at_period_end, not an immediate cancellation — the agent keeps
  // what they already paid for until the period ends, matching what the
  // Plan page's "Cancels [date]" copy promises rather than an abrupt cutoff.
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.require().subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  }

  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return this.require().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
  }
}
