-- One-off test data — NOT a schema migration, run manually once via
-- Supabase Studio's SQL editor (or `psql "$DATABASE_URL" -f
-- supabase/seed/sample_listings.sql`). Creates 3 fully-populated, already-
-- 'verified' listings so the app (search, home feed, detail screen) has
-- real data to exercise end to end, including every listings column —
-- installment_available's 8 supporting columns (0016_listing_installment_
-- details.sql) are only populated on the one listing where that flag is
-- true, matching that migration's own "only meaningful when true" comment.
--
-- owner_id resolves by email via subquery rather than a hardcoded UUID, so
-- this script is self-contained and portable. Requires that account
-- (faizanhashmidev@gmail.com) to already exist.

begin;

-- 1) Sky View Villa — House, Sale, Islamabad, cash (no installment plan), ready.
with new_listing as (
  insert into public.listings (
    owner_id, agent_id, title, description, price, purpose, city, area, society, sub_area,
    latitude, longitude, property_type_id, bedrooms, bathrooms, kitchens, floors,
    area_value, area_unit, year_built, floor_level, furnishing_status, boost_tier,
    installment_available, ready_for_possession, status
  )
  values (
    (select id from auth.users where email = 'faizanhashmidev@gmail.com'),
    null,
    'Sky View Villa',
    'A quiet elegance, close to everything. This residence sits inside one of Islamabad''s most sought-after enclaves — a study in restraint, natural light, and considered proportion. Full-height glazing frames a private courtyard, and quiet interior corridors open onto a landscaped garden that shifts with the seasons.',
    89000000,
    'sale',
    'Islamabad',
    'Bahria Town',
    'Bahria Town Phase 8',
    'Safari Villas',
    33.5651, 73.1547,
    (select id from public.property_types where slug = 'house'),
    5, 6, 2, 3,
    1, 'kanal', 2022, 'Ground + 2',
    'furnished', 'premium',
    false, true, 'verified'
  )
  returning id
)
insert into public.listing_contact_numbers (listing_id, type, country_code, number)
select id, 'mobile', '+92', '3001234567' from new_listing
union all
select id, 'landline', '+92', '512345678' from new_listing;

with target as (select id from public.listings where title = 'Sky View Villa')
insert into public.listing_amenities (listing_id, amenity_id, value)
select target.id, amenities.id, case when amenities.slug = 'parking_spaces' then 4 else null end
from target, public.amenities
where amenities.slug in ('parking_spaces', 'furnished', 'central_air_conditioning', 'community_lawn_garden');

with target as (select id from public.listings where title = 'Sky View Villa')
insert into public.listing_media (listing_id, url, type, is_cover, sort_order)
select target.id, url, 'image', is_cover, sort_order
from target, (values
  ('https://picsum.photos/seed/sky-view-villa-1/1200/800', true, 0),
  ('https://picsum.photos/seed/sky-view-villa-2/1200/800', false, 1),
  ('https://picsum.photos/seed/sky-view-villa-3/1200/800', false, 2)
) as m(url, is_cover, sort_order);

-- 2) Downtown Heights Apartment — Flat, Sale, Karachi, full installment plan.
with new_listing as (
  insert into public.listings (
    owner_id, agent_id, title, description, price, purpose, city, area, society, sub_area,
    latitude, longitude, property_type_id, bedrooms, bathrooms, kitchens, floors,
    area_value, area_unit, year_built, floor_level, furnishing_status, boost_tier,
    installment_available, advance_amount, number_of_installments, monthly_installment,
    balloon_payment_available, balloon_payment_amount,
    balloting_fee_applicable, balloting_fee_amount,
    possession_fee_applicable, possession_fee_amount,
    development_fee_applicable, development_fee_amount,
    ready_for_possession, status
  )
  values (
    (select id from auth.users where email = 'faizanhashmidev@gmail.com'),
    null,
    'Downtown Heights Apartment',
    'A high-floor two-bedroom apartment in one of Clifton''s newer towers, with unobstructed sea-facing views and a flexible three-year payment plan. Handover is projected within 18 months of booking.',
    62000000,
    'sale',
    'Karachi',
    'Clifton',
    'Downtown Heights',
    'Block 5',
    24.8138, 67.0299,
    (select id from public.property_types where slug = 'flat'),
    3, 3, 1, null,
    2200, 'sqft', 2025, '14th Floor',
    'semi_furnished', 'hot',
    true, 12400000, 36, 1100000,
    true, 6200000,
    true, 150000,
    true, 250000,
    true, 400000,
    false, 'verified'
  )
  returning id
)
insert into public.listing_contact_numbers (listing_id, type, country_code, number)
select id, 'mobile', '+92', '3211234567' from new_listing
union all
select id, 'landline', '+92', '213456789' from new_listing;

with target as (select id from public.listings where title = 'Downtown Heights Apartment')
insert into public.listing_amenities (listing_id, amenity_id, value)
select target.id, amenities.id, case when amenities.slug = 'parking_spaces' then 2 else null end
from target, public.amenities
where amenities.slug in ('parking_spaces', 'broadband_internet_access', 'intercom', 'central_air_conditioning');

with target as (select id from public.listings where title = 'Downtown Heights Apartment')
insert into public.listing_media (listing_id, url, type, is_cover, sort_order)
select target.id, url, 'image', is_cover, sort_order
from target, (values
  ('https://picsum.photos/seed/downtown-heights-1/1200/800', true, 0),
  ('https://picsum.photos/seed/downtown-heights-2/1200/800', false, 1),
  ('https://picsum.photos/seed/downtown-heights-3/1200/800', false, 2)
) as m(url, is_cover, sort_order);

-- 3) Garden View House — House, Rent, Lahore.
with new_listing as (
  insert into public.listings (
    owner_id, agent_id, title, description, price, purpose, city, area, society, sub_area,
    latitude, longitude, property_type_id, bedrooms, bathrooms, kitchens, floors,
    area_value, area_unit, year_built, floor_level, furnishing_status, boost_tier,
    installment_available, ready_for_possession, status
  )
  values (
    (select id from auth.users where email = 'faizanhashmidev@gmail.com'),
    null,
    'Garden View House',
    'A well-kept single-family home on a quiet, tree-lined street in Gulberg, available for immediate rent. Bright rooms throughout, a private lawn, and covered parking for two cars.',
    350000,
    'rent',
    'Lahore',
    'Gulberg',
    'Gulberg III',
    'Main Boulevard',
    31.5099, 74.3436,
    (select id from public.property_types where slug = 'house'),
    4, 4, 1, 2,
    10, 'marla', 2015, 'Ground + 1',
    'semi_furnished', 'basic',
    false, true, 'verified'
  )
  returning id
)
insert into public.listing_contact_numbers (listing_id, type, country_code, number)
select id, 'mobile', '+92', '3451234567' from new_listing
union all
select id, 'landline', '+92', '423456789' from new_listing;

with target as (select id from public.listings where title = 'Garden View House')
insert into public.listing_amenities (listing_id, amenity_id, value)
select target.id, amenities.id, case when amenities.slug = 'parking_spaces' then 2 else null end
from target, public.amenities
where amenities.slug in ('parking_spaces', 'community_lawn_garden', 'electricity_backup', 'waste_disposal');

with target as (select id from public.listings where title = 'Garden View House')
insert into public.listing_media (listing_id, url, type, is_cover, sort_order)
select target.id, url, 'image', is_cover, sort_order
from target, (values
  ('https://picsum.photos/seed/garden-view-house-1/1200/800', true, 0),
  ('https://picsum.photos/seed/garden-view-house-2/1200/800', false, 1),
  ('https://picsum.photos/seed/garden-view-house-3/1200/800', false, 2)
) as m(url, is_cover, sort_order);

commit;
