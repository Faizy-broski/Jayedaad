"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { HeroSearchCard } from "@/components/landing/HeroSearchCard";

const EASE = [0.16, 1, 0.3, 1] as const;

const textGroup = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const textItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// Single flat background photo (Minar-e-Pakistan skyline + modern house) with
// the heading/subtext overlaid directly on it — matches the provided mockup.
// Desktop/mobile each get their own block below (same convention the
// previous layered version used) so responsive spacing changes at one
// breakpoint never leak into the other.
export function Hero() {
  return (
    <section className="relative bg-white">
      {/* Desktop (lg+) */}
      <div className="relative hidden lg:block">
        <div className="pt-16 sm:pt-[68px] lg:pt-0">
          <div className="relative h-[560px] w-full overflow-hidden rounded-bl-[72px] rounded-br-[72px] sm:h-[620px] md:h-[680px]">
            <motion.div
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, ease: EASE }}
              className="absolute inset-0"
            >
              <Image
                src="/images/hero-bg.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>

            {/* Left-to-right scrim so the heading stays legible over the
                photo without hiding it, same intent as SearchHero's gradient
                but lighter since this photo is airy, not dark. */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/40 to-transparent" />

            <motion.div
              variants={textGroup}
              initial="hidden"
              animate="show"
              className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-6 pb-24"
            >
              <motion.h1 variants={textItem} className="max-w-xl text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Find your perfect{" "}
                <span className="text-heading-gradient">property in Pakistan</span>
              </motion.h1>
              <motion.p variants={textItem} className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
                Simple search. Verified listings. Smart decisions.
              </motion.p>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
          className="pointer-events-auto absolute inset-x-4 -bottom-24 z-30 mx-auto flex max-w-4xl flex-col"
        >
          <HeroSearchCard />
        </motion.div>
      </div>

      {/* Mobile/tablet (below lg) */}
      <div className="lg:hidden">
        <div className="pt-16 sm:pt-[68px]">
          <div className="relative h-[440px] w-full overflow-hidden rounded-bl-[40px] rounded-br-[40px] sm:h-[520px] sm:rounded-bl-[56px] sm:rounded-br-[56px] md:h-[560px]">
            <motion.div
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, ease: EASE }}
              className="absolute inset-0"
            >
              <Image
                src="/images/hero-bg.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>

            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/60 to-white/90" />

            <motion.div
              variants={textGroup}
              initial="hidden"
              animate="show"
              className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col justify-end px-5 pb-10"
            >
              <motion.h1 variants={textItem} className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                Find your perfect{" "}
                <span className="text-heading-gradient">property in Pakistan</span>
              </motion.h1>
              <motion.p variants={textItem} className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600 sm:text-base">
                Simple search. Verified listings. Smart decisions.
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
            className="relative z-20 mx-4 -mt-6 sm:-mt-10 md:mx-auto md:max-w-4xl"
          >
            <HeroSearchCard />
          </motion.div>
        </div>

        <div className="h-10 sm:h-12" />
      </div>
    </section>
  );
}
