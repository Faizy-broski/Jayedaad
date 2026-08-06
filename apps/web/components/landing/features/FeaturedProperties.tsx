'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { PropertyCard } from './PropertyCard';
import type { Property } from '@/lib/types';
import { TrustFeatures } from './TrustFeatures';
import { Reveal } from '@/components/Reveal';

interface FeaturedPropertiesProps {
  properties: Property[];
}

export function FeaturedProperties({ properties }: FeaturedPropertiesProps) {
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
    <section className="relative overflow-hidden py-4">
      {/* Faint building silhouette bleeding in from the right, behind the
          heading/cards — matches the reference screenshot's watermark bg. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 -bottom-20 w-full max-w-3xl">
        <Image src="/images/bg-image.png" alt="" fill sizes="768px" className="object-cover object-left" />
      </div>

    <TrustFeatures />

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">Handpicked</span>
            <h2 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">Featured properties</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              A curated selection of Pakistan&apos;s most desirable homes — ownership-verified, photographed, and
              ready to move in.
            </p>
          </Reveal>

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <Link
              href="/listings"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary"
            >
              Show all listings
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous properties"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next properties"
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Embla viewport — overflow-hidden is required by Embla itself, not
            just styling, so the track can translate beyond view without the
            page scrolling horizontally. */}
        <div className="mt-8 overflow-hidden" ref={emblaRef}>
          <div className="-ml-5 flex">
            {properties.map((property, index) => (
              <div
                key={property.id}
                className="min-w-0 shrink-0 grow-0 basis-[85%] pl-5 py-4 xs:basis-[70%] sm:basis-1/2 lg:basis-1/4"
              >
                <Reveal delay={(index % 4) * 0.08}>
                  <PropertyCard property={property} />
                </Reveal>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators — mobile only, since desktop already shows the full
            row via the 1/4-basis slides and doesn't need a position cue. */}
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

        {/* Same "Show all listings" CTA as the desktop header row, just
            shown here instead since that row is hidden below sm. */}
        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-5 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary"
          >
            Show all listings
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}