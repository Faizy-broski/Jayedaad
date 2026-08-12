import type { FooterColumn, SocialLink } from '../lib/types';

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Properties',
    links: [
      { label: 'Buy', href: '/listings?purpose=sale' },
      { label: 'Rent', href: '/listings?purpose=rent' },
      { label: 'Sell', href: '/submit' },
      { label: 'Developments', href: '/developments' },
      { label: 'Listings', href: '/listings' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about-us' },
      { label: 'Blog', href: '/blog' },
      { label: 'Agents', href: '/agents' },
      { label: 'Services', href: '/services' },
      { label: 'Contact', href: '/contact-us' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Disclaimers', href: '/disclaimers' },
    ],
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'YouTube', href: 'https://youtube.com' },
];