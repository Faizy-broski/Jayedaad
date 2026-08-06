import Image from 'next/image';
import { Reveal } from '@/components/Reveal';

const STATS = [
  { id: 'listings', value: '150K+', label: 'Verified Listings' },
  { id: 'owners', value: '50K+', label: 'Happy Customers' },
  { id: 'trust', value: '99%', label: 'Verified' },
];

export function OurStory() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-20">

      <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-12">
      <Reveal className="sm:col-span-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
          01 — Our Story
        </span>
        <h2 className="mt-2 max-w-lg text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
          Real estate isn&apos;t just about properties. It&apos;s about building futures.
        </h2>
      </Reveal>
        <Reveal className="flex lg:flex-col gap-8 sm:col-span-3 mx-auto">
          {STATS.map((stat) => (
            <div key={stat.id} className="flex flex-col gap-1">
              <span className="text-primary text-3xl font-bold sm:text-4xl">{stat.value}</span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</span>
            </div>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground sm:col-span-5 sm:text-base">
          <p>
            We began with a simple observation: buying a home in Pakistan had become an act of faith. Listings
            unverified, agents unaccountable, information scattered across corners of the internet.
          </p>
          <p>
            Jayedaad exists to change that. Every property&apos;s ownership is verified before it&apos;s listed.
            Every professional vetted. Every decision supported by technology built for how families actually live
            and buy.
          </p>
          <p>
            We think of ourselves less as a platform and more as a standard — starting with knowing that the person
            listing a property actually owns it.
          </p>
        </Reveal>
      </div>

      {/* Full-width photo banner with a centered wordmark, closing out the
          story section before the values grid. */}
      <Reveal delay={0.15} className="relative mt-14 aspect-[16/9] lg:aspect-[16/7] w-full overflow-hidden rounded-3xl sm:mt-16">
        <Image
          src="/images/about-us/our-story.jpg"
          alt="Jayedaad House entrance — glass facade with landscaped greenery"
          fill
          sizes="(min-width: 1024px) 1152px, 90vw"
          className="object-cover"
        />

        <div className="pointer-events-none relative z-10 flex h-full items-center justify-center">
          <Image
            src="/images/about-us/our-story-jayedaad-logo.png"
            alt="Jayedaad — Building Trust in Real Estate"
            width={220}
            height={248}
            className="h-[70%] w-auto opacity-65 sm:h-full"
          />
        </div>
      </Reveal>
    </section>
  );
}
