-- Parking Spaces was seeded as a plain boolean tag, but the reference form
-- (and 0001_init.sql's own comment, which literally cites "Parking Spaces: 2"
-- as the canonical example of a number-type amenity) shows it as a number
-- input, not a checkbox.
update public.amenities set value_type = 'number', value_unit = 'spaces' where slug = 'parking_spaces';
