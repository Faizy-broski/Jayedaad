'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TestimonialCard } from './TestimonialCards';
import type { Testimonial } from '@/lib/types';
import { Reveal } from '@/components/Reveal';

interface RealStoriesProps {
  testimonials: Testimonial[];
  embedded?: boolean;
}

export function RealStories({ testimonials, embedded = false }: RealStoriesProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 8);
    setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByCard = (direction: 'prev' | 'next') => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-carousel-item]');
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.85;
    el.scrollBy({ left: direction === 'next' ? step : -step, behavior: 'smooth' });
  };

  const content = (
    <div className="relative z-10 mx-auto max-w-6xl px-4">
      <Reveal className="flex items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">Loved by Owners</span>
          <h2 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">Real stories. Real trust.</h2>
        </div>

        {/* Prev/next controls — hidden on touch-first small screens where swipe is natural */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByCard('prev')}
            disabled={!canScrollPrev}
            aria-label="Previous testimonials"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard('next')}
            disabled={!canScrollNext}
            aria-label="Next testimonials"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Reveal>

      <div className="relative mt-8">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((testimonial, index) => (
            <Reveal
              key={testimonial.id}
              delay={(index % 3) * 0.08}
              data-carousel-item
              className="w-[85%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%]"
            >
              <TestimonialCard testimonial={testimonial} />
            </Reveal>
          ))}
        </div>

        {/* Fade edges to hint more content, matches embedded/section bg —
            dark: variant needed since from-white is a real page-surface
            color here, not photo-overlay chrome, and would fade to a
            visibly wrong white sliver against a dark section. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent dark:from-background sm:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-background sm:hidden" />
      </div>
    </div>
  );

  if (embedded) {
    return <div className="mt-16 sm:mt-20">{content}</div>;
  }

  return <section className="py-16 sm:py-20 bg-secondary">{content}</section>;
}