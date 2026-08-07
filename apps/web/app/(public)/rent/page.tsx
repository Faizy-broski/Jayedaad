import { Suspense } from 'react';
import { SearchHero } from '@/components/shared/SearchHero';
import { ListingsBrowserSection } from '@/components/listings/ListingsBrowserSection';

export default function RentPage() {
  return (
    <main>
      <SearchHero
        eyebrow="Rent"
        title="Find your next rental property"
        backgroundImage="/images/about-us/about-us-hero.jpg"
        defaultPurpose="rent"
      />

      {/* ListingsBrowserSection reads ?city=/?propertyTypeCategory=/etc. via
          useSearchParams(), which requires a Suspense boundary in the app
          router. */}
      <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Loading properties…</div>}>
        <ListingsBrowserSection purpose="rent" basePath="/rent" />
      </Suspense>
    </main>
  );
}
