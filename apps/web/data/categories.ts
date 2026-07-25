import type { Category } from '../lib/types';

export const CATEGORIES: Category[] = [
  {
    id: 'luxury-villas',
    label: 'Luxury Villas',
    listingsCount: 3240,
    image: '/images/categories/luxury-villas.jpg',
    href: '/search?type=villa',
  },
  {
    id: 'apartments',
    label: 'Apartments',
    listingsCount: 8120,
    image: '/images/categories/apartments.jpg',
    href: '/search?type=apartment',
  },
  {
    id: 'plots',
    label: 'Plots',
    listingsCount: 12400,
    image: '/images/categories/plots.jpg',
    href: '/search?type=plot',
  },
  {
    id: 'commercial',
    label: 'Commercial',
    listingsCount: 1540,
    image: '/images/categories/commercial.jpg',
    href: '/search?type=commercial',
  },
];