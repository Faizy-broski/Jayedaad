-- Standalone (à la carte) credit purchases — the gap where an agent who
-- runs out of Hot/Super Hot/Refresh credits mid-period had no way to buy
-- more except waiting for the next renewal (SubscriptionsRepository.
-- grantPeriodCredits only tops up on tier (re-)selection/renewal). Mirrors
-- Zameen's individual-product pricing (Refresh/Story credits, Hot/Super Hot
-- listings sold outside any package), on top of the existing bundled
-- per-period allotment, not instead of it.
create table public.credit_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credit_type public.agent_credit_type not null,
  quantity int not null,
  price numeric not null default 0,
  -- Set once a matching one-time Stripe Price exists — same convention as
  -- subscription_tiers.stripe_price_id: null means this pack can be listed
  -- but not checked out yet.
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index credit_packs_active_idx on public.credit_packs (active);

alter table public.credit_packs enable row level security;

-- Public read of active packs — agents need to see what's buyable before
-- checkout, same reasoning as subscription_tiers' public list.
create policy credit_packs_select_active on public.credit_packs
  for select using (active);

-- Super Admin CRUD — service role (used by services/api, which enforces
-- @Roles('super_admin') at the application layer) bypasses RLS entirely,
-- same as every other admin-managed table in this schema.

-- Starting packs, priced individually — editable afterward via the admin
-- Plans page's new "Credit Packs" section with no code change.
insert into public.credit_packs (name, credit_type, quantity, price) values
  ('5 Hot Credits', 'hot', 5, 3900),
  ('5 Super Hot Credits', 'super_hot', 5, 10500),
  ('10 Refresh Credits', 'refresh', 10, 2400);
