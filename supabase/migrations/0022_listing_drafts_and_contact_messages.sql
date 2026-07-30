-- Draft listings: a listing can now be saved with status 'draft' instead of
-- being submitted straight into the verification queue. A draft is a
-- fully-valid listing row (same required columns as any other submission) —
-- it just hasn't been transitioned to pending_verification yet.
alter type public.listing_status add value 'draft' before 'pending_verification';

-- Contact Us: a general support message has no listing to attach to, unlike
-- leads (public.leads.listing_id is a hard FK by design), so it needs its
-- own table rather than being shoehorned into the leads pipeline.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Same defense-in-depth discipline as public.leads (0004_rls_policies.sql):
-- the API's service-role key is the primary enforcement point and bypasses
-- RLS entirely for the public-intake insert. This policy only guards direct
-- Postgres access with the anon/authenticated key — only super_admin can
-- read submissions back.
create policy contact_messages_select_admin on public.contact_messages
  for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
