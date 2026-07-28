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
    <section className="relative h-[280px] w-full overflow-hidden sm:h-[340px] md:h-[350px] lg:h-[400px]">
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
        <span className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70 sm:mb-4 sm:text-sm">
          <span className="h-px w-5 bg-white/50" />
          {eyebrow}
        </span>

        <h1 className="max-w-md whitespace-pre-line text-3xl font-semibold leading-[1.1] text-white sm:max-w-lg sm:text-4xl md:max-w-2xl md:text-5xl lg:text-6xl uppercase">
          {title}
        </h1>

        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/80 sm:max-w-md sm:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}