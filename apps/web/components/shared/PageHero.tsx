import Image from 'next/image';

interface PageHeroProps {
  /** Small label above the heading, e.g. "Contact Jayedaad" */
  eyebrow: string;
  /** Supports line breaks — use "\n" where you want the heading to wrap,
      e.g. "Let's find your\nnext address" */
  title: string;
  description: string;
  backgroundImage: string;
  imageAlt?: string;
}

export function PageHero({
  eyebrow,
  title,
  description,
  backgroundImage,
  imageAlt = '',
}: PageHeroProps) {
  return (
    // pt-16/pt-[68px] roughly match the header's real rendered height (logo
    // h-10/h-11 + py-3) at each breakpoint, so the fixed/attached bar on
    // mobile/md doesn't cover the hero; lg:pt-0 lets it float over the hero
    // instead, same convention as the homepage Hero.
    <div className="pt-16 sm:pt-[68px] lg:pt-0">
      <section className="relative h-[300px] w-full overflow-hidden sm:h-[340px] md:h-[350px] lg:h-[450px]">
        <Image
          src={backgroundImage}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Left-heavy gradient so text stays readable while the right side of
            the photo (where the subject usually is) stays visible, matching
            the reference design. Softens slightly on larger screens where
            there's more breathing room around the text block. */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/55 to-brand-dark/10 sm:from-brand-dark/85 sm:via-brand-dark/45" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-end px-4 pb-8 sm:px-6 sm:pb-12 md:pb-16 lg:pb-20">
          <span className="eyebrow-label mb-3 flex items-center gap-2 text-white/70 sm:mb-4">
            <span className="h-px w-5 bg-white/50" />
            {eyebrow}
          </span>

          <h1 className="heading-display max-w-md whitespace-pre-line text-white uppercase sm:max-w-lg md:max-w-2xl">
            {title}
          </h1>

          <p className="body-text mt-4 max-w-xs text-white/80 sm:max-w-md">{description}</p>
        </div>
      </section>
    </div>
  );
}
