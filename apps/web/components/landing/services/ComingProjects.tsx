import Link from 'next/link';
import { ComingProjectBanner } from './ComingProjectBanner';
import type { ComingProject } from '@/lib/types';
import { Reveal } from '@/components/Reveal';

interface ComingProjectsProps {
  projects: ComingProject[];
}

export function ComingProjects({ projects }: ComingProjectsProps) {
  const [featuredProject] = projects;
  if (!featuredProject) return null;

  return (
    <section className="relative pt-12 sm:py-16 lg:py-20">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <Reveal>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-eyebrow-gradient sm:text-xs">
              Coming Project
            </span>
            <h2 className="mt-2 text-xl font-bold text-heading-gradient sm:text-2xl md:text-3xl">
              {featuredProject.title}
            </h2>
          </Reveal>
          <Link
            href="/search?status=upcoming"
            className="whitespace-nowrap border-b border-slate-300 pb-0.5 text-xs font-medium text-slate-500 transition-colors hover:border-primary hover:text-primary"
          >
            View all
          </Link>
        </div>

        <Reveal className="mt-5 sm:mt-6 lg:mt-8" delay={0.15}>
          <ComingProjectBanner project={featuredProject} />
        </Reveal>
      </div>
    </section>
  );
}