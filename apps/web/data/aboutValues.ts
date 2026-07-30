export interface AboutValue {
  id: string;
  size: 'lg-dark' | 'lg-photo' | 'sm-light' | 'sm-photo' | 'sm-accent';
  label: string;
  title: string;
  description?: string;
  image?: string;
}

export const ABOUT_VALUES: AboutValue[] = [
  {
    id: 'trust-transparency',
    size: 'lg-dark',
    label: 'Trust & Transparency',
    title: 'Every listing _verified_. Every agent _accountable_.',
    image: '/images/bg-image.png',
  },
  {
    id: 'homes-chosen',
    size: 'lg-photo',
    label: 'Customer First',
    title: "Homes chosen the way families actually live.",
    image: '/images/about-us/customer.jpg',
  },
  {
    id: 'technology-driven',
    size: 'sm-light',
    label: 'Technology Driven',
    title: 'Intelligent matching between people and places.',
    description: 'AI-first preference, not price alone.',
  },
  {
    id: 'documents-protected',
    size: 'sm-photo',
    label: 'Secure & Reliable',
    title: 'Documents, verified. Deals, protected.',
    image: '/images/about-us/secure.jpg',
  },
  {
    id: 'growth-mindset',
    size: 'sm-accent',
    label: 'Growth Mindset',
    title: 'We build for the second home before the first has sold.',
  },
  {
    id: 'innovation',
    size: 'sm-light',
    label: 'Innovation',
    title: 'Software that treats a home like a home — not a listing.',
  },
  {
    id: 'legal-compliance',
    size: 'sm-light',
    label: 'Legal Compliance',
    title: 'Every deed, title and clause vetted by our in-house counsel.',
  },
  {
    id: 'community',
    size: 'sm-light',
    label: 'Community',
    title: 'Neighbourhoods, not just numbers.',
  },
];
