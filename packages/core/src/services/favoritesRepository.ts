import { httpClient } from './httpClient';
import { Favorite } from '../models';

// services/api/src/favorites returns raw snake_case rows (no server-side
// mapper, unlike preferencesRepository) — mapped here to match every other
// camelCase model in this package.
function mapRow(row: any): Favorite {
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
  list: async (): Promise<Favorite[]> => {
    const { data } = await httpClient.get('/favorites');
    return (data as any[]).map(mapRow);
  },

  add: async (listingId: string): Promise<Favorite> => {
    const { data } = await httpClient.post(`/favorites/${listingId}`);
    return mapRow(data);
  },

  remove: async (listingId: string): Promise<void> => {
    await httpClient.delete(`/favorites/${listingId}`);
  },
};
