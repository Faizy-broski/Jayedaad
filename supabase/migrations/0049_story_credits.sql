-- Story credit schema — the write side is POST /listings/:id/story
-- (services/api/src/listings), mirroring boost_tier/boost_expires_at's
-- pattern but as a plain on/off flag rather than a tier: a Story placement
-- doesn't rank listings against each other, it's a separate 24-hour
-- featured spot, so there's no "story_tier" to speak of.

-- Granted to agent_credits on tier (re-)selection/renewal, same as
-- hot/super_hot/refresh_credits_per_period.
alter table public.subscription_tiers add column story_credits_per_period int not null default 0;

-- Set when a Story credit is spent; cleared back to null once 24h passes
-- (PlanLifecycleService's cron, same "credits per period, not forever"
-- convention as boost_expires_at).
alter table public.listings add column story_expires_at timestamptz;

-- Gated to the top 2 tiers only, matching Zameen (Story only appears on
-- their higher agency/developer packages) — editable via the admin Plans
-- page afterward with no code change.
update public.subscription_tiers set story_credits_per_period = 2 where name = 'Pro';
update public.subscription_tiers set story_credits_per_period = 5 where name = 'Ultimate';
