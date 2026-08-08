export interface DetailedService {
  id: string;
  tag: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
  badge?: string;
}

export const DETAILED_SERVICES: DetailedService[] = [
  {
    id: 'buy-property',
    tag: 'Residential',
    title: 'Buy Property.',
    description: 'Discover verified homes with confidence. Every listing is legally checked, professionally photographed, and matched to your priorities so decisions never feel rushed.',
    cta: 'Explore Properties',
    href: '/listings?purpose=sale',
    image: '/images/services/buy-property.jpg',
  },
  {
    id: 'sell-property',
    tag: 'Residential · Investment',
    title: 'Sell Property.',
    description: 'Professional valuation, tailored photography, and qualified buyers only — no time-wasters. Your home marketed the way it deserves to be seen.',
    cta: 'Start Your Listing',
    href: '/submit',
    image: '/images/services/sell-property.jpg',
  },
  {
    id: 'rent-property',
    tag: 'Short-Term & Long-Term',
    title: 'Rent Property.',
    description: 'Landlords and tenants matched together seamlessly. Verified paperwork, transparent contracts, and support who actually knows the details.',
    cta: 'Browse Rentals',
    href: '/listings?purpose=rent',
    image: '/images/services/rent-property.jpg',
  },
  {
    id: 'commercial-properties',
    tag: 'Commercial Real Estate',
    title: 'Commercial Properties.',
    description: 'Studio to office space, retail fronts, and warehouses — sourced through vetted leasing and long-term partnerships.',
    cta: 'Explore Commercial',
    href: '/listings?propertyTypeCategory=commercial',
    image: '/images/services/commercial-property.jpg',
  },
  {
    id: 'new-projects',
    tag: 'Upcoming Launches',
    title: 'New Projects.',
    description: "Access to Pakistan's most-anticipated developments — vetted permits, authenticated developers, and early-bird positioning for early buyers.",
    cta: 'Discover Projects',
    href: '/developments',
    image: '/images/services/new-projects.jpg',
  },
  {
    id: 'property-management',
    tag: 'Agent Tools',
    title: 'Property Management.',
    description: 'Tenant relations, maintenance coordination, and quarterly asset reviews — so your property performs quietly, without you having to chase everything.',
    cta: 'Learn More',
    href: '/property-management',
    image: '/images/services/property-management.jpg',
  },
  {
    id: 'property-valuation',
    tag: 'Data-Driven',
    title: 'Property Valuation.',
    description: 'Independent methodology, verified comparables, and market-grade insights that give you real leverage before you negotiate.',
    cta: 'Request Valuation',
    href: '/contact-us',
    image: '/images/services/property-valuation.jpg',
  },
  {
    id: 'investment-advisory',
    tag: 'Portfolio',
    title: 'Investment Advisory.',
    description: 'ROI modelling, city-level demand analysis, and portfolio construction — private, considered advice from consultants who play the long game.',
    cta: 'Speak With an Advisor',
    href: '/contact-us',
    image: '/images/services/investment-advisory.jpg',
    badge: 'NEW',
  },
];
