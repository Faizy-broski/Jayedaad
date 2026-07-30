import { SearchHero } from '@/components/shared/SearchHero';
import { ListingsBrowser } from '@/components/listings/ListingsBrowser';
import { LISTINGS } from '@/data/listings';

export default function ListingsPage() {
  return (
    <main>
      <SearchHero
        eyebrow="Listings"
        title="Find your next property"
        backgroundImage="/images/about-us/about-us-hero.jpg"
        defaultPurpose="buy"
      />

      <ListingsBrowser listings={LISTINGS} />
    </main>
  );
}
