-- Agent/agency help desk: an authenticated agent submits an issue from the
-- dashboard's /help page, Super Admin sees it (with a bell notification) and
-- tracks it to resolution. Deliberately NOT contact_messages (0022) — that
-- table is a public, unauthenticated, throttled intake for anonymous buyer/
-- visitor messages with no user_id and no read-side API; a support ticket is
-- the opposite shape (known authenticated submitter, needs a status
-- lifecycle) and gets its own table, same reasoning 0022's own comment gives
-- for not shoehorning general messages into the leads pipeline.

-- Extends the fixed notification_type enum (0009_notifications.sql) so a new
-- ticket can notify every super_admin the same way an unassigned lead does
-- today (leads.repository.ts's notifySuperAdmins()).
alter type public.notification_type add value 'support_ticket';

create type public.support_ticket_status as enum ('open', 'in_progress', 'resolved');

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  -- Denormalized at submit time from the submitter's agent_profiles.agency_id
  -- (if any) — display-only, so an admin can see which agency a ticket came
  -- from without a join back through agent_profiles.
  agency_id uuid references public.agencies (id) on delete set null,
  subject text not null,
  message text not null,
  status public.support_ticket_status not null default 'open',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_created_by_idx on public.support_tickets (created_by, created_at);
create index support_tickets_status_idx on public.support_tickets (status);

alter table public.support_tickets enable row level security;

-- Same defense-in-depth discipline as contact_messages/leads: the API's
-- service-role key is the primary enforcement point (create()/listAll()/
-- updateStatus() all run through it) and bypasses RLS entirely. These
-- policies only guard direct Postgres access with the anon/authenticated key.
create policy support_tickets_select_own on public.support_tickets
  for select to authenticated
  using (created_by = auth.uid());

create policy support_tickets_select_admin on public.support_tickets
  for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

create policy support_tickets_update_admin on public.support_tickets
  for update to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
