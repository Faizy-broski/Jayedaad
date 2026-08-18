-- Favorites was built listing-only (0007_favorites_and_saved_searches.sql):
-- the buyer-dashboard "New projects" screens never got a heart/save option
-- because the table had nowhere to put a projects favorite. Rather than a
-- separate project_favorites table (which would fork the API/UI logic and
-- the (user_id, listing_id) uniqueness pattern), add a nullable project_id
-- alongside listing_id and require exactly one of the two to be set — same
-- row shape, same RLS policy, same "favorites list" endpoint for both.

alter table public.favorites
  alter column listing_id drop not null,
  add column project_id uuid references public.projects (id) on delete cascade,
  add constraint favorites_target_check check (
    (listing_id is not null and project_id is null) or
    (listing_id is null and project_id is not null)
  );

create unique index favorites_user_project_uidx on public.favorites (user_id, project_id)
  where project_id is not null;

create index favorites_project_idx on public.favorites (project_id);
