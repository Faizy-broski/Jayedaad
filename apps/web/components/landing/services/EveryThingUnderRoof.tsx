import { ServiceCard } from '@/components/landing/services/ServiceCards';
import type { Service } from '@/lib/types';
import { Reveal } from '@/components/Reveal';

interface EverythingUnderOneRoofProps {
  services: Service[];
}

export function EverythingUnderOneRoof({ services }: EverythingUnderOneRoofProps) {
  const [featured, ...rest] = services;
  // First 4 of the remaining 7 sit beside the featured tile in a 2x2 grid;
  // the last 3 (Verify/Valuation/Management/Advisory in the reference — 4
  // items) drop to a full-width row below both.
  const sideItems = rest.slice(0, 4);
  const bottomItems = rest.slice(4);

  return (
    <section className="relative z-10 py-4">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">Services</span>
          <h2 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">Everything under one roof</h2>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          <Reveal className="lg:col-span-2">
            <ServiceCard service={featured} />
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            {sideItems.map((service, index) => (
              <Reveal key={service.id} delay={0.1 + (index % 2) * 0.08}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
        </div>

        {bottomItems.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bottomItems.map((service, index) => (
              <Reveal key={service.id} delay={(index % 4) * 0.08}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}