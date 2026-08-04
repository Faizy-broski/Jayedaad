import { notFound } from 'next/navigation';
import { ProjectDetail } from '@/components/projects-detail/ProjectDetail';
import { PROJECTS } from '@/data/projects';

interface ProjectDetailPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const project = PROJECTS.find((item) => item.slug === params.slug);
  if (!project) notFound();

  const similar = PROJECTS.filter((item) => item.id !== project.id).slice(0, 4);

  return <ProjectDetail project={project} similar={similar} />;
}
