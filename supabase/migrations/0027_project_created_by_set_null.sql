-- Fixes a real bug: 0026_project_created_by.sql added created_by with no
-- ON DELETE action, which defaults to blocking the delete — any user who
-- created a project could no longer be deleted from Supabase at all
-- ("Failed to delete user"). created_by is nullable and only used for
-- ownership/permission checks (canEditProject/canDeleteProject already
-- treat a null createdBy as "unowned, Super Admin only"), so the project
-- itself should survive its creator being deleted, not block the deletion.
alter table public.projects
  drop constraint if exists projects_created_by_fkey,
  add constraint projects_created_by_fkey
    foreign key (created_by) references auth.users (id) on delete set null;
