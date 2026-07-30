-- Backfills amenity_property_type_categories (0001_init.sql) — the join
-- table has existed since day one and the read/write API paths
-- (taxonomy.repository.ts::listAmenities/createAmenity/updateAmenity) were
-- already built against it, but 0005_taxonomy_seed.sql never inserted a
-- single link row. With zero links, GET /taxonomy/amenities?propertyTypeCategorySlug=X
-- always returned [] (a real narrowing, not a fallback-to-all), so the
-- listing submission form's "Feature and Amenities" section has been
-- silently empty for every property type. Category assignments below are a
-- reasonable real-estate judgment call (documented in the implementation
-- plan), not scraped from a source — Plots (raw land) only get amenities
-- that genuinely apply to undeveloped land (nearby locations, security).
insert into public.amenity_property_type_categories (amenity_id, property_type_category_id)
select a.id, c.id
from public.amenities a
join public.property_type_categories c
  on (a.slug, c.slug) in (
    -- Main Features — residential + commercial
    ('parking_spaces', 'residential'), ('parking_spaces', 'commercial'),
    ('double_glazed_windows', 'residential'), ('double_glazed_windows', 'commercial'),
    ('central_air_conditioning', 'residential'), ('central_air_conditioning', 'commercial'),
    ('central_heating', 'residential'), ('central_heating', 'commercial'),
    ('flooring', 'residential'), ('flooring', 'commercial'),
    ('electricity_backup', 'residential'), ('electricity_backup', 'commercial'),
    ('waste_disposal', 'residential'), ('waste_disposal', 'commercial'),
    ('furnished', 'residential'), ('furnished', 'commercial'),

    -- Rooms — residential only, except store rooms / prayer room also commercial
    ('servant_quarters', 'residential'),
    ('drawing_room', 'residential'),
    ('dining_room', 'residential'),
    ('study_room', 'residential'),
    ('prayer_room', 'residential'), ('prayer_room', 'commercial'),
    ('powder_room', 'residential'),
    ('gym_private', 'residential'),
    ('store_rooms', 'residential'), ('store_rooms', 'commercial'),
    ('steam_room', 'residential'),
    ('lounge_sitting_room', 'residential'),
    ('laundry_room', 'residential'),

    -- Business & Communication — residential + commercial
    ('broadband_internet_access', 'residential'), ('broadband_internet_access', 'commercial'),
    ('satellite_cable_tv_ready', 'residential'), ('satellite_cable_tv_ready', 'commercial'),
    ('intercom', 'residential'), ('intercom', 'commercial'),

    -- Community Features — residential only, except pool/gym/medical/day care/mosque also commercial
    ('community_lawn_garden', 'residential'),
    ('swimming_pool_community', 'residential'), ('swimming_pool_community', 'commercial'),
    ('gym_community', 'residential'), ('gym_community', 'commercial'),
    ('medical_centre', 'residential'), ('medical_centre', 'commercial'),
    ('day_care', 'residential'), ('day_care', 'commercial'),
    ('kids_play_area', 'residential'),
    ('barbeque_area', 'residential'),
    ('mosque', 'residential'), ('mosque', 'commercial'),
    ('community_centre', 'residential'),

    -- Healthcare/Recreation — residential only (in-unit amenities)
    ('lawn_garden_recreation', 'residential'),
    ('swimming_pool_recreation', 'residential'),
    ('sauna', 'residential'),
    ('jacuzzi', 'residential'),

    -- Nearby Locations — all three, including plots (raw land still markets proximity)
    ('nearby_schools', 'residential'), ('nearby_schools', 'plot'), ('nearby_schools', 'commercial'),
    ('nearby_hospitals', 'residential'), ('nearby_hospitals', 'plot'), ('nearby_hospitals', 'commercial'),
    ('nearby_shopping_malls', 'residential'), ('nearby_shopping_malls', 'plot'), ('nearby_shopping_malls', 'commercial'),
    ('nearby_restaurants', 'residential'), ('nearby_restaurants', 'plot'), ('nearby_restaurants', 'commercial'),
    ('nearby_public_transport', 'residential'), ('nearby_public_transport', 'plot'), ('nearby_public_transport', 'commercial'),

    -- Other Facilities — residential + commercial, security staff also plot
    ('maintenance_staff', 'residential'), ('maintenance_staff', 'commercial'),
    ('security_staff', 'residential'), ('security_staff', 'plot'), ('security_staff', 'commercial'),
    ('disabled_access', 'residential'), ('disabled_access', 'commercial')
  )
on conflict (amenity_id, property_type_category_id) do nothing;
