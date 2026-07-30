import { notFound } from 'next/navigation';
import { PropertyDetail } from '@/components/listings/PropertyDetail';
import { LISTINGS } from '@/data/listings';

interface ListingDetailPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return LISTINGS.map((listing) => ({ slug: listing.id }));
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const listing = LISTINGS.find((item) => item.id === params.slug);
  if (!listing) notFound();

  const similar = LISTINGS.filter((item) => item.id !== listing.id).slice(0, 4);

  return <PropertyDetail listing={listing} similar={similar} />;
}
