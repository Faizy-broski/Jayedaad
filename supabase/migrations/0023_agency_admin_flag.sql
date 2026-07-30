-- Agency self-management ("Agency Staff") — an agency admin is still role
-- 'agent' everywhere else in the system (dashboard/listings/subscriptions/
-- leads all keep gating on the existing 'agent' role literal); this flag
-- just grants one extra capability, scoped to the agent's own agency_id.
-- Deliberately not a new app_role enum value — that would require touching
-- every existing @Roles('agent', ...) decorator across the API.
alter table public.agent_profiles add column if not exists is_agency_admin boolean not null default false;
