import Image from 'next/image';
import { CategoryCard } from '@/components/landing/category/CategoryCards';
import type { Category } from '@/lib/types';
import { Reveal } from '@/components/Reveal';
import { TrustFeatures } from '@/components/landing/features/TrustFeatures';

interface BrowseByCategoryProps {
  categories: Category[];
}

export function BrowseByCategory({ categories }: BrowseByCategoryProps) {
  return (
<section className="relative overflow-hidden bg-secondary py-12">
      {/* Faint building silhouette bleeding in from the right, behind the
          heading/cards — matches the reference screenshot's watermark bg. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 -bottom-20 w-full max-w-3xl">
        <Image src="/images/bg-image.png" alt="" fill sizes="768px" className="object-cover object-left" />
      </div>

      <TrustFeatures />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">Explore</span>
          <h2 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">Browse by category</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            From investment plots to seafront penthouses — find what fits your life.
          </p>
        </Reveal>

        {categories.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No categories available right now.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Reveal key={category.id} delay={(index % 4) * 0.08}>
                <CategoryCard category={category} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}