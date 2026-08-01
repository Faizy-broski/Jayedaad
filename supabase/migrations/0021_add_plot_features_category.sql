-- Plot listings' "Feature and Amenities" step is missing an entire tab
-- (Plot Features), confirmed against the real Zameen plot posting reference.
-- New enum value split into its own migration — Postgres won't let a new
-- enum value be used in the same transaction that adds it.

alter type public.amenity_category add value 'plot_features';
