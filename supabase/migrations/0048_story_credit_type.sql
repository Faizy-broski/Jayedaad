-- New credit type for Story placements (POST /listings/:id/story) — a
-- 24-hour featured spot, matching Zameen's Story credit ("posts the listing
-- as a 24-hour story... boosts exposure by a factor of 10"). Split into its
-- own migration file/transaction: Postgres doesn't allow a newly added enum
-- value to be referenced by other statements in the same transaction that
-- added it, so the columns/seed that use 'story' live in the next migration.
alter type public.agent_credit_type add value 'story';
