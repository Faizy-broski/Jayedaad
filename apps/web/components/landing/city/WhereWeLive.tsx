import Image from 'next/image';
import Link from 'next/link';
import { CityCard } from './CityCard';
import type { City } from '@/lib/types';

interface WhereWeLiveProps {
  cities: City[];
}

export function WhereWeLive({ cities }: WhereWeLiveProps) {
  return (
    <section className="relative overflow-hidden bg-brand-dark py-20 sm:py-24">
      {/* Faint building/palm watermark across the full section, same
          treatment as the other bg-image sections but tinted to sit on a
          dark background rather than white. */}
      <div className="pointer-events-none absolute inset-0">
        <Image src="/images/explore-bg.png" alt="" fill sizes="100vw" className="object-cover" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-highlight">Explore</span>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Where we live</h2>
            <p className="mt-2 max-w-md text-sm text-white/60">
              From investment plots to seafront penthouses — find what fits your life.
            </p>
          </div>

          <Link
            href="/search"
            className="whitespace-nowrap border-b border-white/40 pb-0.5 text-xs font-medium text-white/80 transition-colors hover:border-white hover:text-white"
          >
            All 24 cities
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </div>
    </section>
  );
}