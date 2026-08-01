-- Ownership scoping for the self-serve edit flow: an agent can edit their
-- own project (until/after approval — editing a verified/rejected project
-- kicks it back to 'pending' for re-review, same rule as listings), a
-- Super Admin can edit any. Nullable since existing rows predate this
-- column and have no known author.
alter table public.projects
  add column created_by uuid references auth.users (id);
