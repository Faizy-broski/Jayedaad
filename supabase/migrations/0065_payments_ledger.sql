-- Real ledger of money actually collected via Stripe — previously
-- nonexistent: `subscriptions` records which tier/status an agent is on,
-- never what was paid, and the webhook (subscriptions.controller.ts) only
-- ever granted entitlements (activated a subscription, topped up credits),
-- never persisted an amount. This is written going forward only, from the
-- moment this migration ships — there is no source data to backfill past
-- payments from, so a fresh table starts genuinely empty rather than being
-- seeded with a fabricated history. The Super Admin dashboard's earnings
-- KPI tiles surface this honestly (a null MIN(created_at) reads as
-- "tracking starts once your first payment lands", never a misleading
-- "PKR 0 all-time").
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_profiles (id) on delete set null,
  source text not null check (source in ('subscription_new', 'subscription_renewal', 'credit_pack', 'credit_cart')),
  tier_id uuid references public.subscription_tiers (id) on delete set null,
  credit_pack_id uuid references public.credit_packs (id) on delete set null,
  billing_interval text check (billing_interval in ('month', 'year')),
  -- Captured from the real Stripe-confirmed amount at the moment of
  -- payment (session.amount_total / invoice.amount_paid) — deliberately
  -- NEVER derived from subscription_tiers.price/credit_packs.price at read
  -- time, since list price can drift (edits, coupons, proration) from what
  -- was actually charged. A ledger is only real if it recorded what
  -- happened, not what current config implies happened.
  amount numeric(12, 2) not null,
  currency text not null default 'PKR',
  -- Idempotency: the Stripe object id that produced this row —
  -- checkout.session.completed -> session.id; invoice.payment_succeeded ->
  -- invoice.id. Stripe webhooks can redeliver the same event; the unique
  -- index below + ON CONFLICT DO NOTHING on this column is what makes a
  -- redelivery a safe no-op instead of a duplicate charge record.
  stripe_reference_id text not null,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create unique index payments_stripe_reference_id_key on public.payments (stripe_reference_id);
create index payments_created_at_idx on public.payments (created_at);
create index payments_tier_id_idx on public.payments (tier_id) where tier_id is not null;
create index payments_agent_id_idx on public.payments (agent_id);

alter table public.payments enable row level security;
-- No client-facing policy at all: written only by the service-role webhook
-- handler (SubscriptionsController's Stripe webhook via PaymentsRepository)
-- and read only by the service-role admin revenue repository — same "no
-- public policy, service role only" convention already used by
-- agent_credits/subscriptions.
