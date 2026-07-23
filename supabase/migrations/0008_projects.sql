-- New Developments/Projects — a Zameen-specific entity with no strong Zillow
-- equivalent: a project (developer, location, completion status) has many
-- unit types. An individual listing MAY belong to a project (a unit within
-- it) or stand alone (the common resale-property case) — hence the nullable
-- FK added to listings below.

create type public.project_status as enum ('planned', 'under_construction', 'ready');

-- Promoted from a plain `developer_name` text column to a real entity:
-- confirmed real on the Zameen New Projects page's "Select Developers"
-- search dropdown and "Featured Developers" section (logo, phone, WhatsApp,
-- project count) — a developer is browsable/searchable, not just a label.
create table public.developers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  phone text,
  whatsapp text,
  city text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  developer_id uuid not null references public.developers (id),
  description text,
  city text not null,
  area text not null,
  status public.project_status not null default 'planned',
  possession_date date,
  cover_image_url text,
  created_at timestamptz not null default now()
);
create index projects_developer_idx on public.projects (developer_id);

-- Verified against a real Zameen "New Projects" page (Zameen Arx): both
-- price and area are shown as RANGES per unit type (e.g. "PKR 3.08-3.88 Cr",
-- "2-2.47 Marla"), and bedrooms/bathrooms are listed per unit type too — none
-- of that was true of the original single-value starting_price/area_value design.
-- property_type_id links each unit type into the SAME Super-Admin-managed
-- taxonomy already built for regular listings (property_types /
-- property_type_categories) rather than inventing a second, project-only
-- category system — confirmed real on Zameen's "Browse Projects by
-- Category" bar (Flats/Plots/Shops/Houses/Commercial Plots/Offices/
-- Penthouse/Farm Houses/Buildings/Warehouses/Industrial Land/Agricultural
-- Land), which maps near-1:1 onto property_types rows.
create table public.project_unit_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  property_type_id uuid not null references public.property_types (id),
  label text not null,
  area_value_min numeric(12, 2),
  area_value_max numeric(12, 2),
  area_unit public.area_unit not null default 'marla',
  price_min numeric(14, 2),
  price_max numeric(14, 2),
  bedrooms int,
  bathrooms int
);
create index project_unit_types_project_idx on public.project_unit_types (project_id);
create index project_unit_types_property_type_idx on public.project_unit_types (property_type_id);

-- Project-level amenities — a real Zameen project page shows a full amenity
-- list (concierge, security, infinity pool, gym, etc.) plus a "Nearby
-- Facilities" section, both covered by the taxonomy already built for
-- listings. Reuses `amenities` rather than a separate project-only list.
create table public.project_amenities (
  project_id uuid not null references public.projects (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id),
  primary key (project_id, amenity_id)
);

-- Structured installment/payment plans — confirmed a prominent, real feature
-- of Zameen new-development pages (e.g. "20% booking + 30 monthly
-- installments", "36 monthly installments + 6 balloon payments"). A genuine
-- differentiator of Projects vs. a regular resale listing.
create table public.project_payment_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null,
  booking_percent numeric(5, 2),
  installment_count int,
  installment_frequency text,
  balloon_payment_count int,
  plan_document_url text, -- the "visual documentation" Zameen shows per plan
  description text
);
create index project_payment_plans_project_idx on public.project_payment_plans (project_id);

-- listings was created in 0001_init.sql, before projects existed — extended
-- here for the same forward-reference reason as agent_profiles.agency_id.
alter table public.listings
  add column project_id uuid references public.projects (id);

create index listings_project_idx on public.listings (project_id);
