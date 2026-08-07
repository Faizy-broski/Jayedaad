import Image from 'next/image';
import { StatItem } from '@/components/landing/about/StatItems';
import { ABOUT_STATS } from '@/data/stats';
import { Reveal } from '@/components/Reveal';

export function AboutSection() {
  return (
     <section className="relative overflow-hidden py-14 sm:py-20 lg:py-8">

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-full max-w-6xl sm:block">
        <Image
          src="/images/about-bg.png"
          alt=""
          fill
          sizes="896px"
          className="object-cover object-right"
        />
      </div>

      {/* Top half — house photo with floating testimonial card + copy */}
      <div className="relative z-10 mx-auto grid max-w-6xl gap-16 px-4 sm:gap-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <Reveal className="relative">
          <div className="relative aspect-[3/3] w-full overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src="/images/about-house-image.png"
              alt="Modern villa exterior at dusk"
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          </div>

          {/* Floating testimonial card — pinned to the bottom-left corner,
              overlapping the image edge. Width is capped relative to the
              container so it never overflows on narrow screens. */}
          <div className="absolute -bottom-6 left-3 w-[calc(100%-2rem)] max-w-64 rounded-xl bg-white p-3 shadow-xl sm:-bottom-8 sm:left-6 sm:w-64 sm:rounded-2xl sm:p-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-white bg-slate-200 sm:h-6 sm:w-6" />
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-white bg-slate-300 sm:h-6 sm:w-6" />
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-white bg-slate-400 sm:h-6 sm:w-6" />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 sm:text-xs">50K+ happy owners</span>
            </div>
            <p className="mt-2 text-[11px] italic leading-relaxed text-slate-500 sm:text-xs">
              &ldquo;Jayedaad made our first home purchase feel effortless.&rdquo;
            </p>
          </div>
        </Reveal>

        <Reveal className="pt-4 lg:pt-4" delay={0.15}>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">About Jayedaad</span>

          <p className="mt-4 text-base font-medium leading-relaxed text-primary sm:text-xl">
            Pakistan&apos;s modern real estate platform built to simplify buying, selling, &amp; investing. We
            combine verified listings, local expertise to help you make confident property decisions.
          </p>

          <h2 className="text-heading-gradient mt-6 flex flex-col text-3xl font-bold uppercase leading-[1.05] tracking-tight sm:mt-8 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            <span className="self-end hidden lg:block">Jayedaad</span>
            <span className="self-start hidden lg:block">Housing</span>
          </h2>
          <h2 className="text-heading-gradient mt-6 flex flex-col text-3xl font-bold uppercase leading-[1.05] tracking-tight sm:mt-8 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl lg:hidden">
           Jayedaad Housing
          </h2>

          <div className="mt-8 flex items-start gap-4 sm:gap-5">
            <p className="max-w-6xl sm:max-w-5xl flex-1 text-sm leading-relaxed text-muted-foreground">
              At Jayedaad, every listing&apos;s ownership is carefully verified before it goes live, giving you peace
              of mind from the start. Whether you&apos;re searching for your first home, a luxury residence, or your
              next investment opportunity, we deliver a seamless experience backed by trust and innovation.
            </p>

            <div className="relative hidden h-[10rem] w-[14rem] shrink-0 overflow-hidden rounded-xl lg:block md:h-24 md:w-32 lg:h-[10rem] lg:w-[12rem]">
              <Image
                src="/images/about-small-image.png"
                alt="Hands reviewing a property model"
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Bottom half — stat strip sitting on the faded building watermark */}
      <div className="relative mt-20 sm:mt-28 lg:mt-32">

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 sm:px-6 lg:px-8">
          <Reveal className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">By the Numbers</span>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
              Trusted by thousands across Pakistan, we&apos;re redefining the way people discover, buy, sell, and
              invest in real estate.
            </p>
          </Reveal>

          <div className="mt-8 grid w-full grid-cols-2 gap-x-6 gap-y-8 sm:mt-10 sm:gap-x-8 sm:gap-y-10 md:grid-cols-4 md:gap-x-12">
            {ABOUT_STATS.map((stat, index) => (
              <Reveal key={stat.id} delay={index * 0.1}>
                <StatItem stat={stat} index={index} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}