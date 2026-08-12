import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { DETAILED_SERVICES } from '@/data/servicesDetailed';

export function FeaturedServicesList() {
  return (
    <section className="mx-auto border-t border-slate-200 max-w-6xl px-4 py-16 sm:py-16">
      <Reveal className='flex items-center justify-between'>
        <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
          02 — Featured Services
        </span>
        <span className='text-xs font-semibold uppercase tracking-widest text-slate-500'>
          08 Practices
        </span>
      </Reveal>

      <div className="mt-10 flex flex-col divide-y divide-slate-200">
        {DETAILED_SERVICES.map((service, index) => {
          const imageFirst = index % 2 === 0;

          return (
            <Reveal
              key={service.id}
              delay={(index % 2) * 0.06}
              className="grid grid-cols-1 items-center gap-6 py-10 sm:grid-cols-2 sm:gap-10"
            >
              <div className={imageFirst ? 'order-1' : 'order-1 sm:order-2'}>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(min-width: 640px) 45vw, 90vw"
                    className="object-cover"
                  />
                  {service.badge && (
                    <span className="absolute left-4 top-4 rounded-full bg-heading-gradient px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      {service.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className={imageFirst ? 'order-2' : 'order-2 sm:order-1'}>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#151B24]">
                  <span className="h-px w-6 bg-[#151B24]" />
                  {service.tag}
                </span>
                <h3 className="mt-2 py-2 text-2xl font-bold leading-tight text-heading-gradient sm:text-4xl">
                  {service.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <Link href={service.href} className="group mt-5 inline-flex flex-col gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    {service.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="h-px w-full bg-slate-300 transition-colors group-hover:bg-primary" />
                </Link>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
