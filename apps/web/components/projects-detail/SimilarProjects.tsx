'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import type { ProjectCardData } from '@/lib/types';


interface SimilarProjectsProps {
  projects: ProjectCardData[];
}

export function SimilarProjects({ projects }: SimilarProjectsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="heading-2 text-heading-gradient">Similar projects</h2>
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-320)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(320)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          No similar projects found.
        </p>
      ) : (
        <div ref={scrollerRef} className="mt-5 flex gap-4 overflow-x-auto pb-2 scroll-smooth">
          {projects.map((project) => (
            <div key={project.id} className="w-64 shrink-0">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
