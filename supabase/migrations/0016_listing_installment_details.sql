-- Structured installment details for listings.installment_available (added
-- in 0001_init.sql as a plain boolean with no supporting fields — the
-- submit form never actually rendered it). Flat columns on listings, not a
-- child table: unlike project_payment_plans (0008_projects.sql, multiple
-- plans per project), a listing has exactly one installment configuration.
-- All amount/count columns nullable — only meaningful when their
-- corresponding boolean is true. No currency column: PKR-only, matching
-- the existing convention (price, phone country code).
alter table public.listings add column if not exists advance_amount numeric(14, 2);
alter table public.listings add column if not exists number_of_installments int;
alter table public.listings add column if not exists monthly_installment numeric(14, 2);

alter table public.listings add column if not exists balloon_payment_available boolean not null default false;
alter table public.listings add column if not exists balloon_payment_amount numeric(14, 2);

alter table public.listings add column if not exists balloting_fee_applicable boolean not null default false;
alter table public.listings add column if not exists balloting_fee_amount numeric(14, 2);

alter table public.listings add column if not exists possession_fee_applicable boolean not null default false;
alter table public.listings add column if not exists possession_fee_amount numeric(14, 2);

alter table public.listings add column if not exists development_fee_applicable boolean not null default false;
alter table public.listings add column if not exists development_fee_amount numeric(14, 2);
