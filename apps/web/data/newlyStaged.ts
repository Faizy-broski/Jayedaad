import type { Property } from '../lib/types';

// Reuses the same Property shape as FEATURED_PROPERTIES — this is a
// separate curated list, so it's a distinct array/query in a real backend,
// not just a re-sort of the same one. ids match entries in data/listings.ts
// so each card's "View Details" link resolves to a real listing page.
export const NEWLY_STAGED_PROPERTIES: Property[] = [
  {
    id: 'sky-view-villa-3',
    title: 'Sky View Villa',
    location: 'Bani Gala, Islamabad',
    price: 'PKR 8.9 Cr',
    priceValue: 89_000_000,
    image: '/images/properties/sky-view-villa.jpg',
    listingType: 'sale',
    verified: true,
    beds: 5,
    baths: 6,
    areaSqft: 1, // see note below on Kanal/Marla units
  },
  {
    id: 'penthouse-clifton-2',
    title: 'Penthouse',
    location: 'Clifton, Karachi',
    price: 'PKR 12.4 Cr',
    priceValue: 124_000_000,
    image: '/images/properties/penthouse-clifton.jpg',
    listingType: 'sale',
    verified: true,
    beds: 4,
    baths: 4,
    areaSqft: 4200,
  },
  {
    id: 'gulberg-residence-2',
    title: 'Gulberg Residence',
    location: 'DHA Phase 8, Karachi',
    price: 'PKR 6.2 Cr',
    priceValue: 62_000_000,
    image: '/images/properties/gulberg-residence.jpg',
    listingType: 'sale',
    verified: true,
    beds: 3,
    baths: 3,
    areaSqft: 2800,
  },
  {
    id: 'dha-townhouse-1',
    title: 'DHA Townhouse',
    location: 'Bahria Town, Lahore',
    price: 'PKR 4.5 Cr',
    priceValue: 45_000_000,
    image: '/images/properties/dha-townhouse.jpg',
    listingType: 'sale',
    verified: true,
    beds: 4,
    baths: 4,
    areaSqft: 10, // Marla, see note below
  },
];