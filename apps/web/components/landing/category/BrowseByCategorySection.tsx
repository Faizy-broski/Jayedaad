'use client';

import { useQueries } from '@tanstack/react-query';
import { listingsRepository, useTaxonomyViewModel } from '@jayedaad/core';
import { BrowseByCategory } from './BrowseByCategory';
import type { Category } from '@/lib/types';

// No dedicated photo per category from the API — these are the only real
// categories today (supabase/migrations/0005_taxonomy_seed.sql: Homes/
// Plots/Commercial), so they're mapped by slug; any category a Super Admin
// adds later falls back to DEFAULT_CATEGORY_IMAGE instead of breaking.
const CATEGORY_IMAGES: Record<string, string> = {
  residential: '/images/categories/luxury-villa.jpg',
  plot: '/images/categories/plots.jpg',
  commercial: '/images/categories/commercial.jpg',
};
const DEFAULT_CATEGORY_IMAGE = '/images/categories/apartments.jpg';

// Cards are entirely API-driven now: label + slug come from
// GET /taxonomy/property-type-categories (Super Admin-managed [Reqs §9]),
// so a rename/add/remove there shows up here without a frontend change.
// href sends the real category slug to /listings?propertyTypeCategory=... —
// see ListingsBrowserSection, which fans the category out across every real
// property type under it (GET /listings only filters by a single
// propertyTypeSlug, not by category) so the click actually filters results.
export function BrowseByCategorySection() {
  const { propertyTypes } = useTaxonomyViewModel();

  const realCategories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);

  const countQueries = useQueries({
    queries: realCategories.map((category) => {
      const slugs = propertyTypes.filter((t) => t.category?.slug === category.slug).map((t) => t.slug);
      return {
        queryKey: ['listings', 'category-count', category.slug],
        queryFn: async () => {
          const pages = await Promise.all(
            slugs.map((propertyTypeSlug) => listingsRepository.searchPublic({ propertyTypeSlug, pageSize: 1 })),
          );
          return pages.reduce((sum, page) => sum + page.total, 0);
        },
        staleTime: 5 * 60_000,
      };
    }),
  });

  const categories: Category[] = realCategories.map((category, index) => ({
    id: category.slug,
    label: category.label,
    listingsCount: countQueries[index].data ?? 0,
    image: CATEGORY_IMAGES[category.slug] ?? DEFAULT_CATEGORY_IMAGE,
    href: `/listings?propertyTypeCategory=${category.slug}`,
  }));

  return <BrowseByCategory categories={categories} />;
}