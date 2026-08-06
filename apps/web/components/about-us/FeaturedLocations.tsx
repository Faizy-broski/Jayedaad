import { CityCard } from '@/components/landing/city/CityCard';
import { Reveal } from '@/components/Reveal';
import type { City } from '@/lib/types';

interface FeaturedLocationsProps {
  cities: City[];
  embedded?: boolean;
}

export function FeaturedLocations({ cities, embedded = false }: FeaturedLocationsProps) {
  const content = (
    <>
      <Reveal>
        <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
          04 — Featured Locations
        </span>
        <h2 className="mt-2 max-w-md text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
          Where we work. Where you&apos;ll live.
        </h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city, index) => (
          <Reveal key={city.id} delay={(index % 3) * 0.08}>
            <CityCard city={city} />
          </Reveal>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return <div className="relative z-10 mx-auto max-w-6xl px-4">{content}</div>;
  }

  return <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">{content}</section>;
}
