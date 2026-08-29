'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PropertyCard } from '@/components/landing/features/PropertyCard';
import type { ListingProperty } from '@/lib/types';

interface SimilarPropertiesProps {
  properties: ListingProperty[];
}

export function SimilarProperties({ properties }: SimilarPropertiesProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="heading-2 text-heading-gradient">Similar properties</h2>
        {properties.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-320)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(320)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {properties.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No similar properties found.
        </p>
      ) : (
        <div ref={scrollerRef} className="mt-5 flex gap-4 overflow-x-auto pb-2 scroll-smooth">
          {properties.map((property) => (
            <div key={property.id} className="w-64 shrink-0">
              <PropertyCard property={property} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
