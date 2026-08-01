-- Fixes a real, pre-existing bug (same class as 0027's projects.created_by
-- fix): search_queries.user_id (0001_init.sql) is nullable but had no
-- ON DELETE action, defaulting to blocking the delete — any user who ever
-- performed a search while logged in could not be deleted from Supabase
-- ("Failed to delete user: {}"). The row is just an analytics log, not
-- something that should keep a user account alive.
alter table public.search_queries
  drop constraint if exists search_queries_user_id_fkey,
  add constraint search_queries_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete set null;
