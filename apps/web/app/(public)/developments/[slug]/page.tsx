import { ProjectDetailSection } from '@/components/projects-detail/ProjectDetailSection';

interface ProjectDetailPageProps {
  params: { slug: string };
}

// Real projects are dynamic rows (GET /projects/:slug), not a fixed static
// set — no generateStaticParams/notFound() here anymore; ProjectDetailSection
// fetches client-side and renders its own not-found state if the slug 404s.
export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  return <ProjectDetailSection slug={params.slug} />;
}
