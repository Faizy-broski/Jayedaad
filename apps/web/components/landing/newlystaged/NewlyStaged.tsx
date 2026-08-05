'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PropertyCard } from '@/components/landing/features/PropertyCard';
import type { Property } from '@/lib/types';
import { Reveal } from '@/components/Reveal';

interface NewlyStagedProps {
  properties: Property[];
}

// Structurally identical to FeaturedProperties' carousel wiring — the only
// differences are copy, label color positioning (arrows sit beside the
// heading here rather than the description), and no bg-image watermark.
export function NewlyStaged({ properties }: NewlyStagedProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 4 },
    },
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback((api: NonNullable<typeof emblaApi>) => {
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
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
        <div className="flex items-start justify-between gap-4">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">Featured</span>
            <h2 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">Newly Staged</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              A curated selection of Pakistan&apos;s most desirable homes — verified, photographed, and ready to
              move in.
            </p>
          </Reveal>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous properties"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 shadow-sm transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next properties"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 shadow-sm transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden" ref={emblaRef}>
          <div className="-ml-5 flex">
            {properties.map((property, index) => (
              <div
                key={property.id}
                className="min-w-0 shrink-0 grow-0 basis-[85%] pl-5 py-6 xs:basis-[70%] sm:basis-1/2 lg:basis-1/4"
              >
                <Reveal delay={(index % 4) * 0.08}>
                  <PropertyCard property={property} />
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}