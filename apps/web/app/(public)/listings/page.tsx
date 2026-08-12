import { Suspense } from 'react';
import { SearchHero } from '@/components/shared/SearchHero';
import { ListingsBrowserSection } from '@/components/listings/ListingsBrowserSection';

interface ListingsPageProps {
  searchParams: { purpose?: string };
}

export default function ListingsPage({ searchParams }: ListingsPageProps) {
  const { purpose } = searchParams;

  return (
    <main>
      <SearchHero
        // eyebrow="Listings"
        // title="Find your next property"
        backgroundImage="/images/listing-hero-bg.png"
        defaultPurpose={purpose === 'rent' ? 'rent' : 'buy'}
        className='h-[20vh] sm:h-[40vh]'
        showPurposeToggle
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
