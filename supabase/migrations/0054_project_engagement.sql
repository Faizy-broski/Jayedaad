-- Mirrors listing_engagement_events (0001_init.sql) for project/developer
-- detail-page engagement (calls/whatsapp/sms/email/click/view) — no reader
-- exists yet, but AgentCard/DeveloperCard now write to this like listings.
create type public.project_engagement_type as enum ('view', 'click', 'call', 'whatsapp', 'sms', 'email');

create table public.project_engagement_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type public.project_engagement_type not null default 'view',
  viewer_session_id text not null,
  platform public.platform_type not null,
  created_at timestamptz not null default now()
);

create index project_engagement_events_project_idx on public.project_engagement_events (project_id);
create index project_engagement_events_type_idx on public.project_engagement_events (project_id, type, created_at);
