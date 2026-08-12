"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { PropertySearchBar } from "@/components/shared/PropertySearchBar";

const EASE = [0.16, 1, 0.3, 1] as const;

const textGroup = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const textItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// Wordmark reveal — plays once on mount/reload only. It starts tucked
// behind the house cutout and glides up into its resting spot, so it
// reads as emerging from behind the house. Purely time-based; scrolling
// the page has no effect on it.
const wordmarkReveal = {
  hidden: { opacity: 0, y: 120 },
  show: {
    opacity: 0.9,
    y: 0,
    transition: { duration: 1.2, ease: EASE, delay: 0.35 },
  },
};

export function Hero() {
  return (
    <section className="relative">
      {/* ————————————————————————————————————————————————————————————
          Desktop (lg+) — own image heights/paddings/overlap technique,
          kept as a self-contained block so responsive work below lg can
          never leak into how this renders at lg+. */}
      <div className="relative hidden lg:block">
        <div className="pt-16 sm:pt-[68px] lg:pt-0">
          <div className="relative h-[480px] w-full overflow-hidden sm:h-[620px] md:h-[680px]">
            <motion.div
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, ease: EASE }}
              className="absolute inset-0"
            >
              <Image
                src="/images/belowest-hero-image.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>

            {/* Wordmark — sits behind the house cutout and glides up into
                place once on mount, reading as if it emerges from behind
                the house. Not tied to scroll in any way. */}
            <motion.div
              variants={wordmarkReveal}
              initial="hidden"
              animate="show"
              className="absolute inset-0 flex justify-center pt-6 shrink-0 sm:pt-[150px]"
            >
              <Image
                src="/images/jayedaad-text.png"
                alt="Jayedaad"
                width={1200}
                height={168}
                priority
                className="h-16 w-full max-w-6xl select-none sm:h-36"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.3, ease: EASE, delay: 0.15 }}
              className="absolute inset-0"
            >
              <Image
                src="/images/top-hero-image.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>

            <motion.div
              variants={textGroup}
              initial="hidden"
              animate="show"
              className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col pb-20 pt-28 sm:pt-[300px] md:pb-28"
            >
              <motion.p
                variants={textItem}
                className="max-w-xs text-left text-sm leading-relaxed text-white/90 sm:text-base"
              >
                Pakistan&apos;s smartest real estate platform for buying,
                selling and renting verified properties.
              </motion.p>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
          className="pointer-events-auto absolute inset-x-4 -bottom-28 z-30 mx-auto flex max-w-4xl flex-col sm:-bottom-10"
        >
          <PropertySearchBar defaultPurpose="buy" />
        </motion.div>
      </div>

      {/* ————————————————————————————————————————————————————————————
          Mobile/tablet (below lg) — redesigned for real screen space
          instead of reusing the desktop's fixed pixel heights: the hero
          photo scales with a responsive height, the wordmark sits in a
          comfortable flex column instead of magic-number padding, and the
          search card sits in normal flow (pulled up with a negative
          margin) rather than the desktop's absolute-overlap technique,
          which only really works with a fixed-height hero. */}
      {/* All screens - same hero composition */}
      <div className="lg:hidden">
        <div className="pt-16 sm:pt-[68px]">
          <div
            className="
        relative
        h-[420px]
        w-full
        overflow-hidden

        sm:h-[560px]
        md:h-[650px]
        lg:h-[680px]
      "
          >
            {/* Background house environment */}
            <motion.div
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, ease: EASE }}
              className="absolute inset-0"
            >
              <Image
                src="/images/belowest-hero-image.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>

            {/* Jayedaad wordmark behind house */}
            <motion.div
              variants={wordmarkReveal}
              initial="hidden"
              animate="show"
              className=" absolute inset-0 flex justify-center pt-28 sm:pt-[170px] md:pt-36 lg:pt-[150px]"
            >
              <Image
                src="/images/jayedaad-text.png"
                alt="Jayedaad"
                width={1200}
                height={168}
                priority
                className=" h-14 w-auto max-w-[90%] sm:h-28 md:h-32 lg:h-36"
              />
            </motion.div>

            {/* House foreground cutout */}
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 1.3,
                ease: EASE,
                delay: 0.15,
              }}
              className="absolute inset-0"
            >
              <Image
                src="/images/top-hero-image.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>

            {/* Content */}
            <motion.div
              variants={textGroup}
              initial="hidden"
              animate="show"
              className=" pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col px-5 pb-12 pt-48 sm:pb-16 sm:pt-[260px] md:pb-20 md:pt-[320px] lg:pb-28 lg:pt-[300px]
"
            >
              <motion.p
                variants={textItem}
                className="
    max-w-xs
    text-left
    text-sm
    leading-relaxed
    text-white/90
    sm:max-w-sm
    sm:text-base
  "
              >
                Pakistan&apos;s smartest real estate platform for buying,
                selling and renting verified properties.
              </motion.p>
            </motion.div>
          </div>

          {/* Floating Search */}
          <motion.div
            initial={{
              opacity: 0,
              y: 24,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              ease: EASE,
              delay: 0.5,
            }}
            className="
        relative
        z-20

        mx-4
        -mt-36

        sm:-mt-20

        md:mx-auto
        md:max-w-4xl
      "
          >
            <PropertySearchBar defaultPurpose="buy" />
          </motion.div>
        </div>

        <div className="h-10 sm:h-12" />
      </div>
    </section>
  );
}
