import { Suspense } from 'react';
import { SearchHero } from '@/components/shared/SearchHero';
import { ListingsBrowserSection } from '@/components/listings/ListingsBrowserSection';

export default function ListingsPage() {
  return (
    <main>
      <SearchHero
        // eyebrow="Listings"
        // title="Find your next property"
        backgroundImage="/images/listing-hero-bg.png"
        defaultPurpose="buy"
        className='h-[20vh] sm:h-[40vh]'
        showPurposeToggle={false}
      />

      {/* ListingsBrowserSection reads ?propertyTypeCategory=/?city= via
          useSearchParams(), which requires a Suspense boundary in the app
          router. */}
      <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Loading listings…</div>}>
        <ListingsBrowserSection />
      </Suspense>
    </main>
  );
}
