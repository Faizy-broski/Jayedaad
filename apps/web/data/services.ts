import {
  Home,
  Search,
  Key,
  Building2,
  UserSearch,
  ShieldCheck,
  TrendingUp,
  BadgeCheck,
  Briefcase,
} from 'lucide-react';
import type { Service } from '../lib/types';

export const SERVICES: Service[] = [
  {
    id: 'buy-property',
    title: 'Buy Property',
    description: 'Search, invest, and close with confidence.',
    href: '/listings?purpose=sale',
    icon: Home,
    image: '/images/services-image.png',
  },
  {
    id: 'sell-property',
    title: 'Sell Property',
    description: 'List, invest, and close with confidence.',
    href: '/submit',
    icon: Search,
  },
  {
    id: 'rent-property',
    title: 'Rent Property',
    description: 'Verified rentals, selected fast.',
    href: '/listings?purpose=rent',
    icon: Key,
  },
  {
    id: 'commercial',
    title: 'Commercial',
    description: 'Offices, retail, and industrial.',
    href: '/listings?type=commercial',
    icon: Building2,
  },
  {
    id: 'find-an-agent',
    title: 'Find an Agent',
    description: 'Match with a local expert.',
    href: '/agents',
    icon: UserSearch,
  },
  {
    id: 'verify-property',
    title: 'Verify Property',
    description: 'Legal & physical inspection.',
    href: '/verify',
    icon: ShieldCheck,
  },
  {
    id: 'property-valuation',
    title: 'Property Valuation',
    description: 'Data-driven pricing insights.',
    href: '/valuation',
    icon: TrendingUp,
  },
  {
    id: 'property-management',
    title: 'Property Management',
    description: 'Hands-off rental operations.',
    href: '/management',
    icon: Briefcase,
  },
  {
    id: 'investment-advisory',
    title: 'Investment Advisory',
    description: 'Portfolio-grade advice.',
    href: '/advisory',
    icon: BadgeCheck,
  },
];