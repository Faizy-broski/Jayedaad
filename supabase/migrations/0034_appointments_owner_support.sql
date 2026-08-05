-- Fixup for 0033: an earlier partial run may have already created
-- `appointments` with the original agent-only schema (agent_id not null,
-- no owner_id) before this pass added individual-owner support. This
-- migration is purely additive/corrective and safe to run regardless of
-- whether 0033 already applied the new schema in full, in part, or not at
-- all (every statement here is a no-op if already satisfied).

alter table public.appointments add column if not exists owner_id uuid references auth.users (id) on delete cascade;
alter table public.appointments alter column agent_id drop not null;

alter table public.appointments drop constraint if exists appointments_subject_xor;
alter table public.appointments add constraint appointments_subject_xor check (
  (agent_id is not null and owner_id is null) or (agent_id is null and owner_id is not null)
);

create index if not exists appointments_owner_idx on public.appointments (owner_id, scheduled_at);
