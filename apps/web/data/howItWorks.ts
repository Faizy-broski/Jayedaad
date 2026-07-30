import { Search, MapPin, BadgeCheck, KeyRound } from 'lucide-react';
import type { HowItWorksStep } from '../lib/types';

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    id: 'search',
    number: '01',
    title: 'Search',
    description: 'Explore verified listings tailored to you.',
    icon: Search,
    position: 'bottom-left',
  },
  {
    id: 'visit',
    number: '02',
    title: 'Visit',
    description: 'Book viewings — virtual or in person.',
    icon: MapPin,
    position: 'top-left',
  },
  {
    id: 'verify',
    number: '03',
    title: 'Verify',
    description: 'Legal and physical inspection, guaranteed.',
    icon: BadgeCheck,
    position: 'top-right',
  },
  {
    id: 'own',
    number: '04',
    title: 'Own',
    description: 'Sign, pay securely, and move in.',
    icon: KeyRound,
    position: 'bottom-right',
  },
];