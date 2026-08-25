-- Lets Super Admin hand a support ticket off to a specific verification_staff
-- member instead of every ticket sitting in one undifferentiated Super
-- Admin-only queue. Nullable/on delete set null: an unassigned ticket (the
-- default, matching every ticket that existed before this migration) is a
-- perfectly normal state, not an error — and if a staff account is ever
-- deleted, its past tickets fall back to unassigned rather than the FK
-- blocking the delete or the ticket silently disappearing from every list.
alter table public.support_tickets add column assigned_to uuid references auth.users (id) on delete set null;

create index support_tickets_assigned_to_idx on public.support_tickets (assigned_to);

-- Same defense-in-depth discipline as the table's existing policies (0043) —
-- the API's service-role key is the real enforcement point; this only
-- guards direct Postgres access with the authenticated key, for the new
-- "verification_staff reads their own assigned tickets" read path
-- (GET /support/tickets/assigned).
create policy support_tickets_select_assigned_staff on public.support_tickets
  for select to authenticated
  using (
    assigned_to = auth.uid()
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'verification_staff'
  );
