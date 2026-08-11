import { PropertyMap } from './PropertyMap';
import type { ListingProperty } from '@/lib/types';

interface PropertyLocationProps {
  listing: ListingProperty;
}

// Previously also fetched real per-listing travel times from a Google
// Places/Distance Matrix-backed endpoint (GET /listings/:id/nearby-places)
// — removed to avoid the ongoing external API cost. "Similar properties"
// (SimilarProperties.tsx, fed by ListingsRepository.findSimilar's same-city
// + same-property-type DB query) covers the "what else is nearby" need
// without any external API involved. Just the real map remains here.
export function PropertyLocation({ listing }: PropertyLocationProps) {
  return <PropertyMap properties={[listing]} />;
}
