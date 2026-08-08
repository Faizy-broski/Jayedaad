import type { AgencyCityCount, AgencyDetail, AgencyStats, AgencyTier, AgencyWithStats } from '@jayedaad/core';

// Local placeholder data — same fictitious agencies/slugs as
// supabase/migrations/0040_sample_agencies_seed.sql, so once that migration
// is applied (and agencies are really verified) the fallback below stops
// triggering and the real API data takes over with matching slugs/URLs.
// Used ONLY as a fallback when the real API returns zero results/errors
// (see TitaniumAgenciesSection/FeaturedAgenciesSection/
// BrowseAgenciesByCitySection/AgencyDetailSection) — never overrides real data.

interface SampleAgencySeed {
  name: string;
  slug: string;
  city: string;
  address: string;
  tier: AgencyTier;
  salesAssociateCount: number;
  forSaleCount: number;
  forRentCount: number;
  description: string;
  staff: { name: string; title: string }[];
}

const SAMPLE_SEEDS: SampleAgencySeed[] = [
  {
    name: 'Skyline Realty Partners',
    slug: 'sample-skyline-realty-partners',
    city: 'Lahore',
    address: 'MM Alam Road, Gulberg III',
    tier: 'titanium',
    salesAssociateCount: 24,
    forSaleCount: 87,
    forRentCount: 89,
    description:
      'A trusted name in Lahore real estate for over a decade, connecting buyers, sellers, and tenants with verified residential and commercial properties across the city.',
    staff: [
      { name: 'Ahmed Raza', title: 'CEO' },
      { name: 'Sana Malik', title: 'Sales Manager' },
      { name: 'Bilal Hussain', title: 'Senior Agent' },
    ],
  },
  {
    name: 'Horizon Estate & Builders',
    slug: 'sample-horizon-estate-builders',
    city: 'Lahore',
    address: 'DHA Phase 5',
    tier: 'titanium',
    salesAssociateCount: 18,
    forSaleCount: 64,
    forRentCount: 41,
    description:
      'Specialists in DHA and Bahria Town properties, offering end-to-end support from site visits to legal transfer.',
    staff: [
      { name: 'Usman Tariq', title: 'Director' },
      { name: 'Hina Farooq', title: 'Sales Associate' },
    ],
  },
  {
    name: 'Crescent Properties',
    slug: 'sample-crescent-properties',
    city: 'Karachi',
    address: 'Clifton Block 5',
    tier: 'titanium',
    salesAssociateCount: 15,
    forSaleCount: 52,
    forRentCount: 37,
    description: "Karachi's coastal-belt specialists, focused on Clifton, DHA, and Bahria Town Karachi listings.",
    staff: [
      { name: 'Fahad Sheikh', title: 'CEO' },
      { name: 'Ayesha Khan', title: 'Sales Manager' },
    ],
  },
  {
    name: 'Northgate Realty',
    slug: 'sample-northgate-realty',
    city: 'Islamabad',
    address: 'F-7 Markaz',
    tier: 'titanium',
    salesAssociateCount: 12,
    forSaleCount: 45,
    forRentCount: 29,
    description: 'Premium residential and diplomatic-enclave properties across Islamabad and Rawalpindi.',
    staff: [
      { name: 'Omar Siddiqui', title: 'Director' },
      { name: 'Zara Ahmed', title: 'Senior Agent' },
    ],
  },
  {
    name: 'Bluewave Estates',
    slug: 'sample-bluewave-estates',
    city: 'Lahore',
    address: 'Johar Town',
    tier: 'featured',
    salesAssociateCount: 9,
    forSaleCount: 31,
    forRentCount: 18,
    description: 'Johar Town and surrounding societies — plots, houses, and rental portfolios.',
    staff: [{ name: 'Kamran Ali', title: 'Sales Associate' }],
  },
  {
    name: 'Emerald Homes & Builders',
    slug: 'sample-emerald-homes-builders',
    city: 'Lahore',
    address: 'Bahria Town',
    tier: 'featured',
    salesAssociateCount: 11,
    forSaleCount: 38,
    forRentCount: 22,
    description: 'Bahria Town Lahore specialists with an in-house construction and handover team.',
    staff: [
      { name: 'Waqas Anjum', title: 'Sales Manager' },
      { name: 'Mahnoor Iqbal', title: 'Sales Associate' },
    ],
  },
  {
    name: 'Silverline Realty',
    slug: 'sample-silverline-realty',
    city: 'Karachi',
    address: 'DHA Phase 6',
    tier: 'featured',
    salesAssociateCount: 7,
    forSaleCount: 26,
    forRentCount: 14,
    description: 'Boutique agency covering DHA Karachi phases 5–8.',
    staff: [{ name: 'Danish Qureshi', title: 'Sales Associate' }],
  },
  {
    name: 'Cedar Grove Properties',
    slug: 'sample-cedar-grove-properties',
    city: 'Islamabad',
    address: 'G-9 Markaz',
    tier: 'featured',
    salesAssociateCount: 8,
    forSaleCount: 29,
    forRentCount: 16,
    description: 'Family-run agency serving G, F, and E sector residents since 2015.',
    staff: [{ name: 'Imran Baig', title: 'CEO' }],
  },
  {
    name: 'Meridian Estate Consultants',
    slug: 'sample-meridian-estate-consultants',
    city: 'Lahore',
    address: 'Model Town',
    tier: 'featured',
    salesAssociateCount: 6,
    forSaleCount: 21,
    forRentCount: 12,
    description: 'Independent advisory-led agency for Model Town and Township buyers and tenants.',
    staff: [{ name: 'Nadia Sheikh', title: 'Sales Associate' }],
  },
  {
    name: 'Oakstone Builders & Realty',
    slug: 'sample-oakstone-builders-realty',
    city: 'Rawalpindi',
    address: 'Bahria Town Phase 4',
    tier: 'featured',
    salesAssociateCount: 5,
    forSaleCount: 17,
    forRentCount: 9,
    description: 'Bahria Town Rawalpindi resale and rental specialists.',
    staff: [{ name: 'Adeel Yousaf', title: 'Sales Manager' }],
  },
  {
    name: 'Falcon Heights Properties',
    slug: 'sample-falcon-heights-properties',
    city: 'Karachi',
    address: 'Gulshan-e-Iqbal',
    tier: 'featured',
    salesAssociateCount: 10,
    forSaleCount: 33,
    forRentCount: 19,
    description: 'Gulshan-e-Iqbal and North Nazimabad apartments and family homes.',
    staff: [
      { name: 'Faisal Mahmood', title: 'Sales Manager' },
      { name: 'Rabia Aslam', title: 'Sales Associate' },
    ],
  },
  {
    name: 'Riverside Estate Group',
    slug: 'sample-riverside-estate-group',
    city: 'Gwadar',
    address: 'New Town',
    tier: 'featured',
    salesAssociateCount: 4,
    forSaleCount: 14,
    forRentCount: 5,
    description: 'Early-mover agency for Gwadar port-city plots and commercial frontage.',
    staff: [{ name: 'Sohail Baloch', title: 'CEO' }],
  },
  {
    name: 'Pinegate Realty',
    slug: 'sample-pinegate-realty',
    city: 'Lahore',
    address: 'Askari 10',
    tier: 'basic',
    salesAssociateCount: 3,
    forSaleCount: 9,
    forRentCount: 4,
    description: 'Small independent agency serving the Askari societies.',
    staff: [{ name: 'Junaid Akram', title: 'Sales Associate' }],
  },
  {
    name: 'Westbrook Properties',
    slug: 'sample-westbrook-properties',
    city: 'Karachi',
    address: 'North Nazimabad',
    tier: 'basic',
    salesAssociateCount: 3,
    forSaleCount: 8,
    forRentCount: 6,
    description: 'North Nazimabad plots and houses, family-run since 2019.',
    staff: [{ name: 'Talha Nawaz', title: 'Sales Associate' }],
  },
  {
    name: 'Sundale Estate Partners',
    slug: 'sample-sundale-estate-partners',
    city: 'Islamabad',
    address: 'E-11',
    tier: 'basic',
    salesAssociateCount: 2,
    forSaleCount: 6,
    forRentCount: 3,
    description: 'E-11 and Bahria Enclave listings.',
    staff: [{ name: 'Hassan Raza', title: 'Sales Associate' }],
  },
  {
    name: 'Harborview Realty',
    slug: 'sample-harborview-realty',
    city: 'Gwadar',
    address: 'Marine Drive',
    tier: 'basic',
    salesAssociateCount: 2,
    forSaleCount: 5,
    forRentCount: 2,
    description: 'Marine Drive commercial and residential plots.',
    staff: [{ name: 'Yasir Latif', title: 'Sales Associate' }],
  },
];

function toAgency(seed: SampleAgencySeed) {
  return {
    id: seed.slug,
    name: seed.name,
    slug: seed.slug,
    logoUrl: null,
    description: seed.description,
    phone: '+923001234567',
    email: null,
    city: seed.city,
    address: seed.address,
    businessHours: 'Monday to Saturday, 10AM–7PM',
    verificationStatus: 'verified' as const,
    salesAssociateCount: seed.salesAssociateCount,
    tier: seed.tier,
  };
}

function toAgencyWithStats(seed: SampleAgencySeed): AgencyWithStats {
  return { ...toAgency(seed), forSaleCount: seed.forSaleCount, forRentCount: seed.forRentCount };
}

export const SAMPLE_AGENCIES: AgencyWithStats[] = SAMPLE_SEEDS.map(toAgencyWithStats);

export const SAMPLE_AGENCY_CITIES: AgencyCityCount[] = Array.from(
  SAMPLE_SEEDS.reduce((counts, seed) => counts.set(seed.city, (counts.get(seed.city) ?? 0) + 1), new Map<string, number>()),
)
  .map(([city, count]) => ({ city, count }))
  .sort((a, b) => b.count - a.count);

// A rough Houses/Flats (for sale) and Houses/Upper Portion (for rent) split
// so the detail page's "Properties By" breakdown has something to show —
// not meant to be exact, just illustrative until real listings exist.
// Slugs match the real taxonomy seed (supabase/migrations/0005_taxonomy_seed.sql)
// so a click-through to /listings?propertyTypeSlug= filters correctly even
// while running on sample data.
function toStats(seed: SampleAgencySeed): AgencyStats {
  const saleHouses = Math.round(seed.forSaleCount * 0.7);
  const rentHouses = Math.round(seed.forRentCount * 0.6);
  return {
    forSaleCount: seed.forSaleCount,
    forRentCount: seed.forRentCount,
    byPropertyType: [
      { propertyTypeSlug: 'house', label: 'Houses', forSale: saleHouses, forRent: rentHouses },
      { propertyTypeSlug: 'flat', label: 'Flats', forSale: seed.forSaleCount - saleHouses, forRent: 0 },
      { propertyTypeSlug: 'upper_portion', label: 'Upper Portion', forSale: 0, forRent: seed.forRentCount - rentHouses },
    ].filter((row) => row.forSale > 0 || row.forRent > 0),
    byBoostTier: [],
  };
}

export const SAMPLE_AGENCY_DETAILS: Record<string, { agency: AgencyDetail; stats: AgencyStats }> = Object.fromEntries(
  SAMPLE_SEEDS.map((seed) => [
    seed.slug,
    {
      agency: {
        ...toAgency(seed),
        staff: seed.staff.map((member, index) => ({
          id: `${seed.slug}-staff-${index}`,
          displayName: member.name,
          title: member.title,
          photoUrl: null,
          phone: '+923001234567',
          whatsapp: '+923001234567',
        })),
      },
      stats: toStats(seed),
    },
  ]),
);
