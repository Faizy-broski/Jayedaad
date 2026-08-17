-- Project boost/promotion — mirrors listings' Hot/Super Hot/Refresh/Story
-- system (public.listing_boost_tier + boost_expires_at/refreshed_at/
-- story_expires_at, see 0001_init.sql:73/176/188 and 0049_story_credits.sql)
-- rather than inventing a parallel schema. Deliberately spends from the
-- SAME agent_credits pool (hot/super_hot/refresh/story) listings already
-- use — no new credit type, no new subscription_tiers columns, no new
-- credit_packs rows. An agent's existing per-period credit allotment can
-- be spent on either a listing or a project, their choice; this keeps the
-- change purely additive with no new pricing decisions required.
--
-- Reusing the named public.listing_boost_tier enum (not declaring a
-- second, identical project_boost_tier type) is deliberate: one tier
-- vocabulary, one credit pool, no reason for two types that must be kept
-- in sync by convention rather than by the type system.
alter table public.projects
  add column boost_tier public.listing_boost_tier not null default 'basic',
  add column boost_expires_at timestamptz,
  add column refreshed_at timestamptz,
  add column story_expires_at timestamptz;

-- Same 2-column shape as listings_boost_tier_idx — sufficient at listings'
-- proven scale; refreshed_at changes too often to be worth indexing.
create index projects_boost_tier_idx on public.projects (boost_tier, created_at desc);
