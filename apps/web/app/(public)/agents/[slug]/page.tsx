import { AgencyDetailSection } from '@/components/agencies/AgencyDetailSection';

export default function AgencyDetailPage({ params }: { params: { slug: string } }) {
  return <AgencyDetailSection slug={params.slug} />;
}
