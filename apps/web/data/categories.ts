import type { Category } from '../lib/types';

export const CATEGORIES: Category[] = [
  {
    id: 'luxury-villas',
    label: 'Luxury Villas',
    listingsCount: 3240,
    image: '/images/categories/luxury-villa.jpg',
    href: '/listings?type=villa',
  },
  {
    id: 'apartments',
    label: 'Apartments',
    listingsCount: 8120,
    image: '/images/categories/apartments.jpg',
    href: '/listings?type=apartment',
  },
  {
    id: 'plots',
    label: 'Plots',
    listingsCount: 12400,
    image: '/images/categories/plots.jpg',
    href: '/listings?type=plot',
  },
  {
    id: 'commercial',
    label: 'Commercial',
    listingsCount: 1540,
    image: '/images/categories/commercial.jpg',
    href: '/listings?type=commercial',
  },
];