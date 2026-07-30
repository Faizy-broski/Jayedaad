-- Extends amenities beyond boolean/number to also support free-text and
-- select (fixed option list) values, and fills in real fields/labels that
-- were confirmed against the actual Zameen "Feature and Amenities" reference
-- but were missing from 0005_taxonomy_seed.sql's initial pass.

alter table public.amenities
  add column value_type text not null default 'boolean'
    check (value_type in ('boolean', 'number', 'text', 'select'));

-- Only set for value_type = 'select' amenities (Flooring/Electricity Backup below).
alter table public.amenities add column options text[];

-- Parallel to the existing `value numeric` column — populated for `text`
-- amenities (free text) or `select` amenities (the chosen option); `value`
-- stays reserved for `number` amenities.
alter table public.listing_amenities add column text_value text;

-- Flooring/Electricity Backup were seeded as plain boolean tags — they're
-- real dropdowns with a fixed option list on the reference form.
update public.amenities
  set value_type = 'select', options = array['Tiles', 'Marble', 'Wooden', 'Chip', 'Cement', 'Other']
  where slug = 'flooring';

update public.amenities
  set value_type = 'select', options = array['UPS', 'Generator', 'Solar', 'None', 'Other']
  where slug = 'electricity_backup';

-- Real fields confirmed present on the reference form but missing from the
-- initial seed. "Built in year"/"Floors" are intentionally NOT added here —
-- those are listings.year_built/listings.floors dedicated columns already
-- elsewhere on the submit form, not amenities.
insert into public.amenities (slug, label, category, value_type, value_unit, sort_order) values
  ('view', 'View', 'main_features', 'text', null, 9),
  ('other_main_features', 'Other Main Features', 'main_features', 'text', null, 10),
  ('other_business_communication_facilities', 'Other Business and Communication Facilities', 'business_communication', 'text', null, 33),
  ('other_community_facilities', 'Other Community Facilities', 'community_features', 'text', null, 49),
  ('other_healthcare_recreation_facilities', 'Other Healthcare and Recreation Facilities', 'healthcare_recreation', 'text', null, 54),
  ('distance_from_airport', 'Distance From Airport', 'nearby_locations', 'number', 'kms', 65),
  ('other_nearby_places', 'Other Nearby Places', 'nearby_locations', 'text', null, 66)
on conflict (slug) do nothing;

-- Label corrections — the seed's generic labels ("Swimming Pool", "Gym",
-- "Medical Centre", "Day Care") were disambiguated from their in-unit
-- healthcare_recreation counterparts via distinct slugs, but the reference
-- form shows the fuller community-specific labels.
update public.amenities set label = 'Community Swimming Pool' where slug = 'swimming_pool_community';
update public.amenities set label = 'Community Gym' where slug = 'gym_community';
update public.amenities set label = 'First Aid or Medical Centre' where slug = 'medical_centre';
update public.amenities set label = 'Day Care Centre' where slug = 'day_care';

-- Category links for the 7 new amenities — same judgment-call pattern as
-- 0017_amenity_category_links.sql (residential + commercial for general
-- features, all three for nearby-location fields).
insert into public.amenity_property_type_categories (amenity_id, property_type_category_id)
select a.id, c.id
from public.amenities a
join public.property_type_categories c
  on (a.slug, c.slug) in (
    ('view', 'residential'), ('view', 'commercial'),
    ('other_main_features', 'residential'), ('other_main_features', 'commercial'),
    ('other_business_communication_facilities', 'residential'), ('other_business_communication_facilities', 'commercial'),
    ('other_community_facilities', 'residential'), ('other_community_facilities', 'commercial'),
    ('other_healthcare_recreation_facilities', 'residential'),
    ('distance_from_airport', 'residential'), ('distance_from_airport', 'plot'), ('distance_from_airport', 'commercial'),
    ('other_nearby_places', 'residential'), ('other_nearby_places', 'plot'), ('other_nearby_places', 'commercial')
  )
on conflict (amenity_id, property_type_category_id) do nothing;
