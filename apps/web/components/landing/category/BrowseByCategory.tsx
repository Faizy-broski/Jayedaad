import { CategoryCard } from '@/components/landing/category/CategoryCards';
import type { Category } from '@/lib/types';

interface BrowseByCategoryProps {
  categories: Category[];
}

export function BrowseByCategory({ categories }: BrowseByCategoryProps) {
  return (
    <section className="py-16 bg-[#F3F5F966]">
      <div className="mx-auto max-w-6xl px-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-highlight">Explore</span>
        <h2 className="mt-2 text-3xl font-bold text-brand-dark sm:text-4xl">Browse by category</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          From investment plots to seafront penthouses — find what fits your life.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}