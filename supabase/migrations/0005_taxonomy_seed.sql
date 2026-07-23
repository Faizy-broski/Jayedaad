-- Baseline taxonomy so the platform isn't empty on day one. Rows here are
-- just starting data — Super Admin can add/edit/retire entries at runtime via
-- the taxonomy API (services/api/src/taxonomy), that's the whole point of
-- these being tables instead of enums.
--
-- Amenities below are verbatim from a real, scraped Zameen.com listing
-- detail page (ID 54309389, a 1 Kanal house in Bahria Town Sector C, Lahore)
-- — not guessed. "Kitchens" is intentionally excluded here: on the real page
-- it appeared as a count ("3 Kitchens"), which is why listings.kitchens is a
-- dedicated int column (see 0001_init.sql) rather than a boolean amenity.
-- Some labels (Gym, Swimming Pool, Lawn/Garden) legitimately repeat across
-- categories on the source page — private vs. community versions of the
-- same amenity — so slugs are disambiguated while labels stay verbatim.

-- Verified verbatim against the real Zameen property-type dropdown
-- (user-supplied, direct from the live filter panel — not scraped/inferred).
-- Order matches the real dropdown exactly. Residential was already a 7/7
-- match from the earlier listings-detail-page research; Commercial was
-- missing "Other" and Plot was missing "Plot File"/"Plot Form" — both real,
-- common Pakistani terms for a pre-possession scheme allocation sold on
-- documentation only, distinct from a physically demarcated plot. ("Reset"
-- in the user's supplied list is the dropdown's own reset button, not a
-- property type — correctly excluded here.)
-- Top-level categories — labels match the real Zameen nav tabs verbatim
-- ("Homes | Plots | Commercial"). Slugs kept as residential/plot/commercial
-- for continuity with the filter values already used throughout the API
-- (GET /listings?propertyTypeCategory=residential, etc.).
insert into public.property_type_categories (slug, label, sort_order) values
  ('residential', 'Homes', 1),
  ('plot', 'Plots', 2),
  ('commercial', 'Commercial', 3);

insert into public.property_types (slug, label, category_id, sort_order) values
  ('house', 'House', (select id from public.property_type_categories where slug = 'residential'), 1),
  ('upper_portion', 'Upper Portion', (select id from public.property_type_categories where slug = 'residential'), 2),
  ('farm_house', 'Farm House', (select id from public.property_type_categories where slug = 'residential'), 3),
  ('penthouse', 'Penthouse', (select id from public.property_type_categories where slug = 'residential'), 4),
  ('flat', 'Flat/Apartment', (select id from public.property_type_categories where slug = 'residential'), 5),
  ('lower_portion', 'Lower Portion', (select id from public.property_type_categories where slug = 'residential'), 6),
  ('room', 'Room', (select id from public.property_type_categories where slug = 'residential'), 7),
  ('residential_plot', 'Residential Plot', (select id from public.property_type_categories where slug = 'plot'), 8),
  ('agricultural_land', 'Agricultural Land', (select id from public.property_type_categories where slug = 'plot'), 9),
  ('plot_file', 'Plot File', (select id from public.property_type_categories where slug = 'plot'), 10),
  ('commercial_plot', 'Commercial Plot', (select id from public.property_type_categories where slug = 'plot'), 11),
  ('industrial_land', 'Industrial Land', (select id from public.property_type_categories where slug = 'plot'), 12),
  ('plot_form', 'Plot Form', (select id from public.property_type_categories where slug = 'plot'), 13),
  ('office', 'Office', (select id from public.property_type_categories where slug = 'commercial'), 14),
  ('warehouse', 'Warehouse', (select id from public.property_type_categories where slug = 'commercial'), 15),
  ('building', 'Building', (select id from public.property_type_categories where slug = 'commercial'), 16),
  ('shop', 'Shop', (select id from public.property_type_categories where slug = 'commercial'), 17),
  ('factory', 'Factory', (select id from public.property_type_categories where slug = 'commercial'), 18),
  ('other', 'Other', (select id from public.property_type_categories where slug = 'commercial'), 19);

insert into public.amenities (slug, label, category, sort_order) values
  -- Main Features
  ('parking_spaces', 'Parking Spaces', 'main_features', 1),
  ('double_glazed_windows', 'Double Glazed Windows', 'main_features', 2),
  ('central_air_conditioning', 'Central Air Conditioning', 'main_features', 3),
  ('central_heating', 'Central Heating', 'main_features', 4),
  ('flooring', 'Flooring', 'main_features', 5),
  ('electricity_backup', 'Electricity Backup', 'main_features', 6),
  ('waste_disposal', 'Waste Disposal', 'main_features', 7),
  ('furnished', 'Furnished', 'main_features', 8),
  -- Rooms
  ('servant_quarters', 'Servant Quarters', 'rooms', 10),
  ('drawing_room', 'Drawing Room', 'rooms', 11),
  ('dining_room', 'Dining Room', 'rooms', 12),
  ('study_room', 'Study Room', 'rooms', 13),
  ('prayer_room', 'Prayer Room', 'rooms', 14),
  ('powder_room', 'Powder Room', 'rooms', 15),
  ('gym_private', 'Gym', 'rooms', 16),
  ('store_rooms', 'Store Rooms', 'rooms', 17),
  ('steam_room', 'Steam Room', 'rooms', 18),
  ('lounge_sitting_room', 'Lounge/Sitting Room', 'rooms', 19),
  ('laundry_room', 'Laundry Room', 'rooms', 20),
  -- Business & Communication
  ('broadband_internet_access', 'Broadband Internet Access', 'business_communication', 30),
  ('satellite_cable_tv_ready', 'Satellite/Cable TV Ready', 'business_communication', 31),
  ('intercom', 'Intercom', 'business_communication', 32),
  -- Community Features
  ('community_lawn_garden', 'Community Lawn/Garden', 'community_features', 40),
  ('swimming_pool_community', 'Swimming Pool', 'community_features', 41),
  ('gym_community', 'Gym', 'community_features', 42),
  ('medical_centre', 'Medical Centre', 'community_features', 43),
  ('day_care', 'Day Care', 'community_features', 44),
  ('kids_play_area', 'Kids Play Area', 'community_features', 45),
  ('barbeque_area', 'Barbeque Area', 'community_features', 46),
  ('mosque', 'Mosque', 'community_features', 47),
  ('community_centre', 'Community Centre', 'community_features', 48),
  -- Healthcare/Recreation
  ('lawn_garden_recreation', 'Lawn/Garden', 'healthcare_recreation', 50),
  ('swimming_pool_recreation', 'Swimming Pool', 'healthcare_recreation', 51),
  ('sauna', 'Sauna', 'healthcare_recreation', 52),
  ('jacuzzi', 'Jacuzzi', 'healthcare_recreation', 53),
  -- Nearby Locations
  ('nearby_schools', 'Schools', 'nearby_locations', 60),
  ('nearby_hospitals', 'Hospitals', 'nearby_locations', 61),
  ('nearby_shopping_malls', 'Shopping Malls', 'nearby_locations', 62),
  ('nearby_restaurants', 'Restaurants', 'nearby_locations', 63),
  ('nearby_public_transport', 'Public Transport', 'nearby_locations', 64),
  -- Other Facilities
  ('maintenance_staff', 'Maintenance Staff', 'other_facilities', 70),
  ('security_staff', 'Security Staff', 'other_facilities', 71),
  ('disabled_access', 'Disabled Access', 'other_facilities', 72);
