import { httpClient } from './httpClient';
// services/api/src/favorites returns raw snake_case rows (no server-side
// mapper, unlike preferencesRepository) — mapped here to match every other
// camelCase model in this package.
function mapRow(row) {
    return {
        id: row.id,
        listingId: row.listings?.id ?? row.listing_id,
        createdAt: row.created_at,
        listing: row.listings
            ? {
                id: row.listings.id,
                title: row.listings.title,
                price: row.listings.price,
                city: row.listings.city,
                area: row.listings.area,
                status: row.listings.status,
            }
            : null,
    };
}
// Self-scoped via the caller's own JWT (no id param) — GET/POST/DELETE
// /favorites, any authenticated role.
export const favoritesRepository = {
    list: async () => {
        const { data } = await httpClient.get('/favorites');
        return data.map(mapRow);
    },
    add: async (listingId) => {
        const { data } = await httpClient.post(`/favorites/${listingId}`);
        return mapRow(data);
    },
    remove: async (listingId) => {
        await httpClient.delete(`/favorites/${listingId}`);
    },
};
