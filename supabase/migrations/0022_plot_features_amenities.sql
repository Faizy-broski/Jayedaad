-- Seeds the new 'plot_features' amenities (see 0021), adds a matching
-- "Other Facilities" free-text field (following the same
-- other_<category>-slug pattern as other_main_features/other_nearby_places
-- in 0019), and fixes the five nearby-location count fields — seeded as
-- plain boolean tags in 0005_taxonomy_seed.sql, but shown as number inputs
-- on the reference form. Same class of bug 0020_parking_spaces_numeric.sql
-- already fixed for Parking Spaces, never applied here. These fields are
-- shared across residential/commercial/plot (0017_amenity_category_links.sql),
-- so the fix applies to all three, not just plots.

insert into public.amenities (slug, label, category, value_type, sort_order) values
  ('other_plot_features', 'Other Plot Features', 'plot_features', 'text', 1),
  ('possession', 'Possession', 'plot_features', 'boolean', 2),
  ('corner', 'Corner', 'plot_features', 'boolean', 3),
  ('park_facing', 'Park Facing', 'plot_features', 'boolean', 4),
  ('disputed', 'Disputed', 'plot_features', 'boolean', 5),
  ('file', 'File', 'plot_features', 'boolean', 6),
  ('balloted', 'Balloted', 'plot_features', 'boolean', 7),
  ('sewerage', 'Sewerage', 'plot_features', 'boolean', 8),
  ('electricity', 'Electricity', 'plot_features', 'boolean', 9),
  ('water_supply', 'Water Supply', 'plot_features', 'boolean', 10),
  ('sui_gas', 'Sui Gas', 'plot_features', 'boolean', 11),
  ('boundary_wall', 'Boundary Wall', 'plot_features', 'boolean', 12),
  ('other_facilities', 'Other Facilities', 'other_facilities', 'text', 73)
on conflict (slug) do nothing;

update public.amenities
  set value_type = 'number'
  where slug in ('nearby_schools', 'nearby_hospitals', 'nearby_shopping_malls', 'nearby_restaurants', 'nearby_public_transport');

insert into public.amenity_property_type_categories (amenity_id, property_type_category_id)
select a.id, c.id
from public.amenities a
join public.property_type_categories c
  on (a.slug, c.slug) in (
    ('other_plot_features', 'plot'),
    ('possession', 'plot'),
    ('corner', 'plot'),
    ('park_facing', 'plot'),
    ('disputed', 'plot'),
    ('file', 'plot'),
    ('balloted', 'plot'),
    ('sewerage', 'plot'),
    ('electricity', 'plot'),
    ('water_supply', 'plot'),
    ('sui_gas', 'plot'),
    ('boundary_wall', 'plot'),
    ('other_facilities', 'residential'), ('other_facilities', 'plot'), ('other_facilities', 'commercial')
  )
on conflict (amenity_id, property_type_category_id) do nothing;
