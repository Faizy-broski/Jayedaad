-- Projects previously had zero plan-based limit (only a role check —
-- agent/super_admin — via ProjectsController). Brings Project creation to
-- parity with Listings, which already enforce listing_quota via
-- EntitlementsService — a project quota is deliberately its OWN column,
-- not shared with listing_quota, since a project is a much bigger
-- undertaking than a single listing (a development with many unit types),
-- and the admin should be able to price/limit them independently.
alter table public.subscription_tiers add column project_quota int not null default 0;

-- Seed real per-tier defaults, same pattern as 0042/0046/0049's per-tier
-- updates — proportionally smaller than each tier's listing_quota since
-- projects are the higher-stakes, lower-volume product.
update public.subscription_tiers set project_quota = 0 where name = 'Lite';
update public.subscription_tiers set project_quota = 1 where name = 'Go';
update public.subscription_tiers set project_quota = 3 where name = 'Pro';
update public.subscription_tiers set project_quota = 10 where name = 'Ultimate';
