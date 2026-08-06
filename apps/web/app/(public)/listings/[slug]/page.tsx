import { PropertyDetailSection } from '@/components/listings/PropertyDetailSection';

interface ListingDetailPageProps {
  params: { slug: string };
}

// Real listings are dynamic rows (GET /listings/:id), not a fixed static
// set — no generateStaticParams/notFound() here anymore; PropertyDetailSection
// fetches client-side and renders its own not-found state if the id 404s.
export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  return <PropertyDetailSection listingId={params.slug} />;
}
