import Link from 'next/link';
import { ComingProjectBanner } from './ComingProjectBanner';
import type { ComingProject } from '@/lib/types';

interface ComingProjectsProps {
  projects: ComingProject[];
}

export function ComingProjects({ projects }: ComingProjectsProps) {
  const [featuredProject] = projects;
  if (!featuredProject) return null;

  return (
    <section className="relative py-16 sm:py-18">
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-highlight">Coming Project</span>
            <h2 className="mt-2 text-2xl font-bold text-brand-dark sm:text-3xl">{featuredProject.title}</h2>
          </div>
          <Link
            href="/search?status=upcoming"
            className="whitespace-nowrap border-b border-slate-300 pb-0.5 text-xs font-medium text-slate-500 transition-colors hover:border-primary hover:text-primary"
          >
            View all
          </Link>
        </div>

        <div className="mt-6">
          <ComingProjectBanner project={featuredProject} />
        </div>
      </div>
    </section>
  );
}