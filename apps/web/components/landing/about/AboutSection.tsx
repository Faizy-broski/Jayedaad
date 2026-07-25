import Image from 'next/image';
import { StatItem } from '@/components/landing/about/StatItems';
import { ABOUT_STATS } from '@/data/stats';

export function AboutSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">

         <div className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-6xl">
          <Image
            src="/images/about-bg.png"
            alt=""
            fill
            sizes="896px"
            className="object-cover object-right"
          />
        </div>
      {/* Top half — house photo with floating testimonial card + copy */}
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
            <Image
              src="/images/about-house-image.png"
              alt="Modern villa exterior at dusk"
              fill
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          </div>

          {/* Floating testimonial card — pinned to the bottom-left corner,
              overlapping the image edge. */}
          <div className="absolute -bottom-8 left-4 w-64 rounded-2xl bg-white p-4 shadow-xl sm:left-6">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <span className="h-6 w-6 rounded-full border-2 border-white bg-slate-200" />
                <span className="h-6 w-6 rounded-full border-2 border-white bg-slate-300" />
                <span className="h-6 w-6 rounded-full border-2 border-white bg-slate-400" />
              </div>
              <span className="text-xs font-semibold text-slate-800">50K+ happy owners</span>
            </div>
            <p className="mt-2 text-xs italic leading-relaxed text-slate-500">
              &ldquo;Jayedaad made our first home purchase feel effortless.&rdquo;
            </p>
          </div>
        </div>

        <div className="lg:pt-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-highlight">About Jayedaad</span>

          <p className="mt-4 text-lg font-medium leading-relaxed text-brand-dark sm:text-xl">
            Pakistan&apos;s modern real estate platform built to simplify buying, selling, &amp; investing. We
            combine verified listings, local expertise to help you make confident property decisions.
          </p>

          <h2 className="mt-8 text-4xl font-black leading-[1.05] text-primary sm:text-5xl">Jayedaad Housing</h2>

          <div className="mt-8 flex items-start gap-5">
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              At Jayedaad, every listing is carefully verified to ensure transparency, accuracy, and peace of mind.
              Whether you&apos;re searching for your first home, a luxury residence, or your next investment
              opportunity, we deliver a seamless experience backed by trust and innovation.
            </p>

            <div className="relative hidden h-24 w-32 shrink-0 overflow-hidden rounded-xl sm:block">
              <Image
                src="/images/about-small-image.png"
                alt="Hands reviewing a property model"
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom half — stat strip sitting on the faded building watermark */}
      <div className="relative mt-28 sm:mt-32">

        <div className="relative z-10 mx-auto flex-col items-center max-w-6xl px-4">
          <div className='flex justify-between items-center'>
            <span className="text-xs font-semibold uppercase tracking-widest text-highlight">By the Numbers</span>
          <p className="max-w-sm text-right text-sm leading-relaxed text-muted-foreground">
            Trusted by thousands across Pakistan, we&apos;re redefining the way people discover, buy, sell, and
            invest in real estate.
          </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-x-12">
            {ABOUT_STATS.map((stat, index) => (
              <StatItem key={stat.id} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}