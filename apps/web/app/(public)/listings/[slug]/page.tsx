import { PropertyDetailSection } from '@/components/listings/PropertyDetailSection';
interface ListingDetailPageProps {
  params: { slug: string };
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
return <PropertyDetailSection listingId={params.slug} />;
}
