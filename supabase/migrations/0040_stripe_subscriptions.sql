-- Real Stripe payment collection for paid subscription tiers. Previously
-- POST /subscriptions/me/select (subscriptions.controller.ts) let any agent
-- self-grant any tier — including paid ones — with zero payment collected,
-- flagged in the production-readiness security audit. Free tiers (price = 0)
-- keep using that instant self-service path; paid tiers now require a real
-- Stripe Checkout session, reconciled here via webhook.

-- Which Stripe Price object a tier maps to — set by whoever manages
-- subscription_tiers (currently Super Admin-only, see subscription_tiers'
-- existing "free text, Super Admin-managed" comment in 0001_init.sql) once
-- the matching Product/Price is created in the Stripe dashboard. Null for
-- free tiers, and for any tier not yet configured for checkout (checkout
-- fails loudly with a clear error in that case rather than silently
-- granting the tier for free).
alter table public.subscription_tiers add column stripe_price_id text;

-- Reconciliation fields, written only by the webhook handler
-- (services/api/src/subscriptions/subscriptions.repository.ts), never by a
-- client-facing endpoint.
alter table public.subscriptions add column stripe_customer_id text;
alter table public.subscriptions add column stripe_subscription_id text;
create index subscriptions_stripe_subscription_idx on public.subscriptions (stripe_subscription_id);
