-- Phase 2 of the Document Verification spec: "number of sales associates"
-- is now a mandatory field at agency onboarding. default 1 only exists so
-- pre-existing rows stay valid — RegisterAgencyDto requires it on every new
-- self-service signup, there is no server-side fallback to the default.
alter table public.agencies add column sales_associate_count int not null default 1;
