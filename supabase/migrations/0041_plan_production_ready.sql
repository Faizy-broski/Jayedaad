-- Production-readiness pass for the subscription Plans feature. Closes
-- several real gaps found in a deep audit: listing quota was a displayed
-- stat only (never enforced), boost_tier had zero write path (permanently
-- stuck at 'basic'), and nothing tracked a Stripe cancel-at-period-end
-- request. See services/api/src/subscriptions/ for the application code
-- these columns back.

-- The plan's monthly featured-listing allotment — granted to agent_credits
-- on tier (re-)selection and on each successful recurring payment (see
-- SubscriptionsRepository.assign()/assignFromStripeCheckout() and the
-- webhook's invoice.payment_succeeded handling).
alter table public.subscription_tiers add column hot_credits_per_period int not null default 0;
alter table public.subscription_tiers add column super_hot_credits_per_period int not null default 0;

-- Set true via POST /subscriptions/me/cancel (Stripe cancel_at_period_end,
-- not an immediate cutoff) and kept in sync from the webhook's
-- customer.subscription.updated event. Lets the UI show "Cancels [date]"
-- instead of "Renews [date]".
alter table public.subscriptions add column cancel_at_period_end boolean not null default false;

-- A spent Hot/Super Hot credit (POST /listings/:id/boost) sets boost_tier
-- AND this expiry — without a expiry, a single credit would permanently
-- boost a listing with no way back to 'basic', which isn't a real
-- "featured listing rule", just a one-way switch. PlanLifecycleService (a
-- cron) reverts boost_tier to 'basic' once this passes.
alter table public.listings add column boost_expires_at timestamptz;

-- Seed the 4 named plans (Lite/Go/Pro/Ultimate) — idempotent via the
-- existing `name` unique constraint, safe to run even if tiers already
-- exist from earlier manual testing. These are starting defaults, not
-- hardcoded constants: the admin Plans page (Super Admin-only) can edit
-- every one of these numbers afterward with no code change.
-- stripe_price_id is left null for all 4 — real Stripe Products/Prices
-- don't exist yet; Lite doesn't need one (it's free), the paid 3 need one
-- set via the admin form before they can actually be checked out.
insert into public.subscription_tiers
  (name, listing_quota, price, analytics_depth, hot_credits_per_period, super_hot_credits_per_period)
values
  ('Lite', 5, 0, '{"analyticsDepth": "basic", "viewCountDetail": "total_only"}'::jsonb, 0, 0),
  ('Go', 15, 2999, '{"analyticsDepth": "standard", "viewCountDetail": "breakdown_by_source"}'::jsonb, 2, 0),
  ('Pro', 40, 6999, '{"analyticsDepth": "advanced", "viewCountDetail": "breakdown_by_source"}'::jsonb, 5, 2),
  ('Ultimate', 100, 14999, '{"analyticsDepth": "full", "viewCountDetail": "full_timeseries"}'::jsonb, 10, 5)
on conflict (name) do nothing;
