-- Production-readiness security audit (system-wide pass) flagged these
-- tables as having NO row-level security at all — unlike every other
-- sensitive table in this schema, which is either policy-protected
-- (0004_rls_policies.sql, 0010_rls_policies_v2.sql, 0011_profile_settings.sql)
-- or explicitly "enabled, zero policies, service-role only" with a comment
-- (listing_documents/onboarding_documents in 0012_documents.sql,
-- email_otp_codes in 0014_email_otp_codes.sql, owner_identity_verifications/
-- owner_identity_documents in 0031_owner_identity_verification.sql,
-- appointments in 0033_appointments.sql, blog_categories/blog_posts in
-- 0037_blog_posts.sql). These had no comment justifying the omission —
-- an oversight, not a deliberate call, given they hold PII/financial data
-- or CRM-adjacent data about leads/agents.
--
-- Defense-in-depth only: the NestJS API always uses the service-role key
-- and bypasses RLS entirely today (per the design note in
-- 0004_rls_policies.sql) — these policies only matter if the anon/
-- authenticated key is ever used to query Postgres directly. Zero policies,
-- matching the exact posture used for the tables listed above.

-- PII
alter table public.profiles enable row level security;
alter table public.listing_contact_numbers enable row level security;

-- Financial / billing
alter table public.agent_credits enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_tiers enable row level security;

-- CRM-adjacent — only the parent `leads` table itself got a policy in
-- 0004_rls_policies.sql; these hold notes/activity/history about the same
-- leads and were never revisited.
alter table public.lead_notes enable row level security;
alter table public.lead_activity enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.lead_assignments enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;

-- User activity data
alter table public.search_queries enable row level security;
