import type { FooterColumn, SocialLink } from '../lib/types';

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Properties',
    links: [
      { label: 'Buy', href: '/search?purpose=sale' },
      { label: 'Rent', href: '/search?purpose=rent' },
      { label: 'Sell', href: '/submit' },
      { label: 'Commercial', href: '/search?type=commercial' },
      { label: 'New Projects', href: '/search?status=upcoming' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Press', href: '/press' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Disclaimers', href: '/disclaimers' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help center', href: '/help' },
      { label: 'Trust & safety', href: '/trust-safety' },
      { label: 'Contact us', href: '/contact' },
    ],
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'YouTube', href: 'https://youtube.com' },
];