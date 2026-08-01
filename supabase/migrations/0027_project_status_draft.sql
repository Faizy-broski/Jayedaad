-- Backs the Projects form's new "Save as Draft" action (mirrors listings'
-- draft concept, but implemented as a plain status value rather than a
-- separate route, since project_status was already client-settable on
-- CreateProjectDto — unlike listings' status, which is always forced
-- server-side). A draft project also needs to stay out of the Super Admin
-- approval queue, so 'draft' is added to verification_status too and used
-- in place of 'pending' until the project is saved as a real project.
alter type public.project_status add value 'draft';

alter table public.projects drop constraint projects_verification_status_check;
alter table public.projects
  add constraint projects_verification_status_check
    check (verification_status in ('pending', 'verified', 'rejected', 'draft'));
