-- One-off test data — NOT a schema migration, run manually once via
-- Supabase Studio's SQL editor (or `psql "$DATABASE_URL" -f
-- supabase/seed/sample_projects.sql`). Creates 3 developers and 3 fully-
-- populated, already-'verified' projects (0008_projects.sql,
-- 0024_project_media_fields.sql, 0025_project_verification_status.sql,
-- 0026/0027_project_created_by_set_null.sql, 0027_project_status_draft.sql)
-- with real unit types, payment plans, and amenities, so the mobile Project
-- Detail screen has real data to exercise end to end.
--
-- created_by resolves by email via subquery rather than a hardcoded UUID,
-- same pattern as sample_listings.sql. Requires that account
-- (faizanhashmidev@gmail.com) to already exist.

begin;

-- 1) Meridian Heights — Flat/apartment tower, Lahore, under construction.
with new_developer as (
  insert into public.developers (name, slug, logo_url, description, phone, whatsapp, city)
  values (
    'Meridian Developments',
    'meridian-developments',
    'https://picsum.photos/seed/meridian-developments-logo/200/200',
    'A Lahore-based developer known for mid-rise residential towers in established, well-connected neighbourhoods.',
    '+923001112233',
    '+923001112233',
    'Lahore'
  )
  returning id
),
new_project as (
  insert into public.projects (
    name, slug, developer_id, description, city, area, status, possession_date,
    cover_image_url, gallery_image_urls, floor_plan_urls, video_url, brochure_url,
    verification_status, created_by
  )
  select
    'Meridian Heights',
    'meridian-heights',
    new_developer.id,
    'A 14-storey residential tower in the heart of Gulberg, built around a shared podium garden, resident gym, and 24/7 concierge. Studio, two-bed, and three-bed apartments are available, with handover phased across two towers.',
    'Lahore',
    'Gulberg',
    'under_construction',
    '2027-06-30',
    'https://picsum.photos/seed/meridian-heights-cover/1200/800',
    array[
      'https://picsum.photos/seed/meridian-heights-1/1200/800',
      'https://picsum.photos/seed/meridian-heights-2/1200/800',
      'https://picsum.photos/seed/meridian-heights-3/1200/800'
    ],
    array[
      'https://picsum.photos/seed/meridian-heights-floorplan-1/1000/1200',
      'https://picsum.photos/seed/meridian-heights-floorplan-2/1000/1200'
    ],
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://picsum.photos/seed/meridian-heights-brochure/900/1200',
    'verified',
    (select id from auth.users where email = 'faizanhashmidev@gmail.com')
  from new_developer
  returning id
)
insert into public.project_unit_types (project_id, property_type_id, label, area_value_min, area_value_max, area_unit, price_min, price_max, bedrooms, bathrooms)
select new_project.id, (select id from public.property_types where slug = 'flat'), label, area_min, area_max, 'sqft', price_min, price_max, beds, baths
from new_project, (values
  ('Studio Apartment', 550::numeric, 620::numeric, 18500000::numeric, 20500000::numeric, 0, 1),
  ('2-Bed Apartment', 1100::numeric, 1250::numeric, 32000000::numeric, 36500000::numeric, 2, 2),
  ('3-Bed Apartment', 1650::numeric, 1800::numeric, 45000000::numeric, 51000000::numeric, 3, 3)
) as u(label, area_min, area_max, price_min, price_max, beds, baths);

with target as (select id from public.projects where slug = 'meridian-heights')
insert into public.project_payment_plans (project_id, label, booking_percent, installment_count, installment_frequency, balloon_payment_count, plan_document_url, description)
select target.id, label, booking_percent, installment_count, installment_frequency, balloon_count, doc_url, description
from target, (values
  ('Standard Plan', 20::numeric, 36, 'monthly', 0, 'https://picsum.photos/seed/meridian-heights-plan-1/900/1200', '20% booking followed by 36 equal monthly installments over 3 years.'),
  ('Extended Plan', 15::numeric, 48, 'monthly', 4, 'https://picsum.photos/seed/meridian-heights-plan-2/900/1200', '15% booking, 48 monthly installments, plus 4 balloon payments tied to construction milestones.')
) as p(label, booking_percent, installment_count, installment_frequency, balloon_count, doc_url, description);

with target as (select id from public.projects where slug = 'meridian-heights')
insert into public.project_amenities (project_id, amenity_id)
select target.id, amenities.id
from target, public.amenities
where amenities.slug in ('parking_spaces', 'gym_community', 'swimming_pool_community', 'kids_play_area', 'mosque', 'electricity_backup');

-- 2) The Orchard Residences — House plots/villas, Islamabad, planned.
with new_developer as (
  insert into public.developers (name, slug, logo_url, description, phone, whatsapp, city)
  values (
    'Orchard Group',
    'orchard-group',
    'https://picsum.photos/seed/orchard-group-logo/200/200',
    'A master-planned-community developer focused on low-density, green-forward suburban housing around Islamabad.',
    '+923331234567',
    '+923331234567',
    'Islamabad'
  )
  returning id
),
new_project as (
  insert into public.projects (
    name, slug, developer_id, description, city, area, status, possession_date,
    cover_image_url, gallery_image_urls, floor_plan_urls, video_url, brochure_url,
    verification_status, created_by
  )
  select
    'The Orchard Residences',
    'the-orchard-residences',
    new_developer.id,
    'A gated community of single-family houses set among mature orchards in Bahria Town, with dedicated cycling paths, a community lawn, and a neighbourhood mosque. Pre-launch bookings are open ahead of groundbreaking.',
    'Islamabad',
    'Bahria Town',
    'planned',
    '2029-03-31',
    'https://picsum.photos/seed/orchard-residences-cover/1200/800',
    array[
      'https://picsum.photos/seed/orchard-residences-1/1200/800',
      'https://picsum.photos/seed/orchard-residences-2/1200/800'
    ],
    array[
      'https://picsum.photos/seed/orchard-residences-floorplan-1/1000/1200'
    ],
    null,
    'https://picsum.photos/seed/orchard-residences-brochure/900/1200',
    'verified',
    (select id from auth.users where email = 'faizanhashmidev@gmail.com')
  from new_developer
  returning id
)
insert into public.project_unit_types (project_id, property_type_id, label, area_value_min, area_value_max, area_unit, price_min, price_max, bedrooms, bathrooms)
select new_project.id, (select id from public.property_types where slug = 'house'), label, area_min, area_max, 'marla', price_min, price_max, beds, baths
from new_project, (values
  ('5 Marla House', 5::numeric, 5::numeric, 22000000::numeric, 24500000::numeric, 3, 4),
  ('10 Marla House', 10::numeric, 10::numeric, 38000000::numeric, 42000000::numeric, 5, 6)
) as u(label, area_min, area_max, price_min, price_max, beds, baths);

with target as (select id from public.projects where slug = 'the-orchard-residences')
insert into public.project_payment_plans (project_id, label, booking_percent, installment_count, installment_frequency, balloon_payment_count, plan_document_url, description)
select target.id, 'Pre-Launch Plan', 10::numeric, 24, 'quarterly', 2, 'https://picsum.photos/seed/orchard-residences-plan/900/1200', '10% booking, 24 quarterly installments, and 2 balloon payments at possession milestones.'
from target;

with target as (select id from public.projects where slug = 'the-orchard-residences')
insert into public.project_amenities (project_id, amenity_id)
select target.id, amenities.id
from target, public.amenities
where amenities.slug in ('parking_spaces', 'community_lawn_garden', 'barbeque_area', 'mosque', 'electricity_backup');

-- 3) Skyline Business Bay — Commercial (offices + shops), Karachi, ready/complete.
with new_developer as (
  insert into public.developers (name, slug, logo_url, description, phone, whatsapp, city)
  values (
    'Skyline Properties',
    'skyline-properties',
    'https://picsum.photos/seed/skyline-properties-logo/200/200',
    'A commercial real-estate developer delivering Grade-A office and retail space along Karachi''s Clifton corridor.',
    '+923215556677',
    '+923215556677',
    'Karachi'
  )
  returning id
),
new_project as (
  insert into public.projects (
    name, slug, developer_id, description, city, area, status, possession_date,
    cover_image_url, gallery_image_urls, floor_plan_urls, video_url, brochure_url,
    verification_status, created_by
  )
  select
    'Skyline Business Bay',
    'skyline-business-bay',
    new_developer.id,
    'A completed 20-storey mixed commercial tower in Clifton with ground-floor retail and Grade-A office floors above, fully handed over with immediate possession.',
    'Karachi',
    'Clifton',
    'ready',
    '2025-11-01',
    'https://picsum.photos/seed/skyline-business-bay-cover/1200/800',
    array[
      'https://picsum.photos/seed/skyline-business-bay-1/1200/800',
      'https://picsum.photos/seed/skyline-business-bay-2/1200/800',
      'https://picsum.photos/seed/skyline-business-bay-3/1200/800'
    ],
    array[
      'https://picsum.photos/seed/skyline-business-bay-floorplan-1/1000/1200'
    ],
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://picsum.photos/seed/skyline-business-bay-brochure/900/1200',
    'verified',
    (select id from auth.users where email = 'faizanhashmidev@gmail.com')
  from new_developer
  returning id
)
insert into public.project_unit_types (project_id, property_type_id, label, area_value_min, area_value_max, area_unit, price_min, price_max, bedrooms, bathrooms)
select new_project.id, (select id from public.property_types where slug = pt_slug), label, area_min, area_max, 'sqft', price_min, price_max, null, baths
from new_project, (values
  ('Office Floor', 'office', 1800::numeric, 2200::numeric, 55000000::numeric, 68000000::numeric, 2),
  ('Ground-Floor Shop', 'shop', 300::numeric, 600::numeric, 15000000::numeric, 28000000::numeric, 1)
) as u(label, pt_slug, area_min, area_max, price_min, price_max, baths);

with target as (select id from public.projects where slug = 'skyline-business-bay')
insert into public.project_payment_plans (project_id, label, booking_percent, installment_count, installment_frequency, balloon_payment_count, plan_document_url, description)
select target.id, 'Cash / On Possession', 100::numeric, 0, null, 0, null, 'Fully complete and handed over — full payment on transfer, no installment plan.'
from target;

with target as (select id from public.projects where slug = 'skyline-business-bay')
insert into public.project_amenities (project_id, amenity_id)
select target.id, amenities.id
from target, public.amenities
where amenities.slug in ('parking_spaces', 'broadband_internet_access', 'electricity_backup', 'intercom');

commit;
