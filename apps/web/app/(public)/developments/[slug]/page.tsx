import { ProjectDetailSection } from '@/components/projects-detail/ProjectDetailSection';

interface ProjectDetailPageProps {
  params: { slug: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
return <ProjectDetailSection slug={params.slug} />;
}
