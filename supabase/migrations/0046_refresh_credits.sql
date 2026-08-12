-- Wires up the 'refresh' agent_credit_type, which has existed in the enum
-- since 0001_init.sql but never had a period allotment or a spend path —
-- POST /listings/:id/refresh (services/api/src/listings) is the write side
-- this schema backs, mirroring how hot_credits_per_period/
-- super_hot_credits_per_period back POST /listings/:id/boost.

-- Granted to agent_credits on tier (re-)selection and each successful
-- recurring payment, same as hot_credits_per_period — see
-- SubscriptionsRepository.grantPeriodCredits().
alter table public.subscription_tiers add column refresh_credits_per_period int not null default 0;

-- A spent refresh credit bumps this to now(), used as a secondary sort key
-- ahead of created_at (see the listings query order in
-- ListingsRepository) so a refreshed listing outranks older, un-refreshed
-- ones at the same boost tier. Unlike boost_expires_at, this never reverts
-- — a refresh is a one-time bump, not a timed state.
alter table public.listings add column refreshed_at timestamptz;

-- Starting allotments, scaled with tier the same way hot/super_hot credits
-- are — editable afterward via the admin Plans page with no code change.
update public.subscription_tiers set refresh_credits_per_period = 5 where name = 'Go';
update public.subscription_tiers set refresh_credits_per_period = 15 where name = 'Pro';
update public.subscription_tiers set refresh_credits_per_period = 40 where name = 'Ultimate';
