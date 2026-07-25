import type { ComingProject } from '../lib/types';

export const COMING_PROJECTS: ComingProject[] = [
  {
    id: 'skyline-one',
    title: 'Skyline One',
    location: 'DHA Phase 6, Karachi',
    price: 'Rs 42.5 Cr',
    description: 'Skyline One with private pool, six suites, and cinema.',
    image: '/images/services-building-image.jpg',
    beds: 6,
    baths: 7,
    areaSqft: 6400,
    agent: {
      name: 'Meera Kohan',
      avatar: '/images/agents/meera-kohan.jpg',
    },
    href: '/properties/skyline-one',
  },
];