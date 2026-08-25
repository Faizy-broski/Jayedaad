-- Annual billing option per tier — optional per tier (null = monthly-only,
-- unchanged existing behavior). annual_price must match the real amount on
-- stripe_annual_price_id's Stripe Price object, same manual-entry
-- convention as price/stripe_price_id (0040_stripe_subscriptions.sql).
-- Discount vs monthly is never stored, only derived from these two real
-- numbers at render time (see getAnnualDiscountPercent in
-- packages/core/src/services/subscriptionsRepository.ts) — storing a
-- discount percent instead risks it silently drifting from what Stripe
-- actually charges.
alter table public.subscription_tiers add column annual_price numeric(12, 2);
alter table public.subscription_tiers add column stripe_annual_price_id text;

-- Which interval the agent is actually paying — previously subscriptions
-- had no way to tell a monthly subscriber from an annual one. Needed for
-- the Plan page's price display and for the monthly credit-drip sweep
-- below. Every existing row is monthly by construction, hence the default.
alter table public.subscriptions add column billing_interval text not null default 'month'
  check (billing_interval in ('month', 'year'));

-- Last time this subscription's per-period credits (hot/super_hot/refresh/
-- story) were granted via SubscriptionsRepository.grantPeriodCredits() —
-- lets PlanLifecycleService's new dripAnnualCredits() sweep top up annual
-- subscribers monthly instead of once a year (Stripe's
-- invoice.payment_succeeded/subscription_cycle event only fires once/year
-- for an annual subscription, so relying on it alone would under-credit
-- annual subscribers to 1/12th their intended allotment).
alter table public.subscriptions add column credits_granted_at timestamptz;
