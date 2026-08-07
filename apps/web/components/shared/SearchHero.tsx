'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { PropertySearchBar, type SearchBarPurpose, type SearchBarVariant } from './PropertySearchBar';

interface SearchHeroProps {
  backgroundImage: string;
  imageAlt?: string;
  eyebrow?: string;
  title?: string;
  defaultPurpose?: SearchBarPurpose;
  variant?: SearchBarVariant;
}

const EASE = [0.16, 1, 0.3, 1] as const;

// Reusable "hero photo + floating search card" section. The image sits at
// z-0, a readability gradient at z-[1], the heading copy at z-[5], and the
// search card at z-10 so it always stacks above the photo/gradient while the
// section's bottom margin reserves room for the card's negative offset —
// same layering approach as the homepage Hero, extracted so other pages
// (e.g. /listings) can reuse it with their own background image and copy.
export function SearchHero({
  backgroundImage,
  imageAlt = '',
  eyebrow,
  title,
  defaultPurpose = 'buy',
  variant = 'listings',
}: SearchHeroProps) {
  return (
    // pt-16/pt-[68px] roughly match the header's real rendered height (logo
    // h-10/h-11 + py-3) at each breakpoint, so the fixed/attached bar on
    // mobile/md doesn't cover the hero; lg:pt-0 lets it float over the hero
    // instead, same convention as the homepage Hero.
    <div className="pt-16 sm:py-[68px] lg:pt-0">
      <section className="relative mb-8 sm:mb-20 md:mb-16">
        <div className="relative h-[30vh] sm:h-[55vh] lg:h-[70vh] w-full overflow-hidden">
          <Image
            src={backgroundImage}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-brand-dark/70 via-brand-dark/30 to-brand-dark/50" />

          {(eyebrow || title) && (
            <div className="relative z-[5] mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center px-4 text-center">
              {eyebrow && (
                <span className="eyebrow-label mb-3 flex items-center gap-2 text-white/70">
                  <span className="h-px w-5 bg-white/50" />
                  {eyebrow}
                  <span className="h-px w-5 bg-white/50" />
                </span>
              )}
              {title && <h1 className="heading-display max-w-2xl text-white">{title}</h1>}
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
          className="relative z-10 mx-auto -mt-10 flex w-full max-w-4xl flex-col px-4 sm:absolute sm:inset-x-4 sm:-bottom-16 sm:mt-0 sm:px-0 md:-bottom-10"
        >
          <PropertySearchBar variant={variant} defaultPurpose={defaultPurpose} />
        </motion.div>
      </section>
    </div>
  );
}
