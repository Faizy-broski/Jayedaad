'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectCard } from '@/components/projects-detail/ProjectCard';
import type { ProjectCardData } from '@/lib/types';
import { Reveal } from '@/components/Reveal';

interface NewProjectsProps {
  projects: ProjectCardData[];
}

// Structurally identical to FeaturedProperties/NewlyStaged's carousel
// wiring — same embla setup, just ProjectCard instead of PropertyCard.
export function NewProjects({ projects }: NewProjectsProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: false,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 4 },
    },
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback((api: NonNullable<typeof emblaApi>) => {
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect(emblaApi);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-8 sm:pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">New Launches</span>
            <h2 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">New Projects</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Fresh developments from Pakistan&apos;s leading developers — verified and ready to explore.
            </p>
          </Reveal>

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <Link
              href="/developments"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary"
            >
              Show all projects
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous projects"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next projects"
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden" ref={emblaRef}>
          <div className="-ml-5 flex">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="min-w-0 shrink-0 grow-0 basis-[85%] pl-5 py-6 xs:basis-[70%] sm:basis-1/2 lg:basis-1/4"
              >
                <Reveal delay={(index % 4) * 0.08}>
                  <ProjectCard project={project} />
                </Reveal>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 sm:hidden">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => scrollTo(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === selectedIndex ? 'w-5 bg-primary' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            href="/developments"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-5 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary"
          >
            Show all projects
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
