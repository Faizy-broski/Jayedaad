import { Suspense } from 'react';
import { SearchHero } from '@/components/shared/SearchHero';
import { ListingsBrowserSection } from '@/components/listings/ListingsBrowserSection';

export default function BuySellPage() {
  return (
    <main>
      <SearchHero
        eyebrow="Buy & Sell"
        title="Find your next property to buy"
        backgroundImage="/images/about-us/about-us-hero.jpg"
        defaultPurpose="buy"
      />

      {/* ListingsBrowserSection reads ?city=/?propertyTypeCategory=/etc. via
          useSearchParams(), which requires a Suspense boundary in the app
          router. */}
      <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Loading properties…</div>}>
        <ListingsBrowserSection purpose="sale" basePath="/buy-sell" />
      </Suspense>
    </main>
  );
}
