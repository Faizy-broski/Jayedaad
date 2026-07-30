'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Wallet, BedDouble, Home, Search as SearchIcon } from 'lucide-react';

type Purpose = 'buy' | 'rent' | 'commercial';

const PURPOSE_TABS: { label: string; value: Purpose }[] = [
  { label: 'Buy', value: 'buy' },
  { label: 'Rent', value: 'rent' },
  { label: 'Commercial', value: 'commercial' },
];

const BUDGET_OPTIONS = ['Any', 'Under 50 Lac', '50 Lac - 1 Cr', '1 Cr - 3 Cr', '3 Cr+'];
const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4', '5+'];
const TYPE_OPTIONS = ['Any', 'House', 'Apartment', 'Villa', 'Plot', 'Commercial'];

const EASE = [0.16, 1, 0.3, 1] as const;

const textGroup = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const textItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

function PurposeTabs({
  purpose,
  onChange,
  layoutId,
  className = '',
}: {
  purpose: Purpose;
  onChange: (p: Purpose) => void;
  layoutId: string;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-auto inline-flex items-center gap-1 self-center rounded-full border border-white/25 bg-white/10 p-1 backdrop-blur-md ${className}`}
    >
      {PURPOSE_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className="relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-6 sm:py-2 sm:text-sm"
        >
          {purpose === tab.value && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-white shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className={`relative z-10 whitespace-nowrap ${purpose === tab.value ? 'text-brand-dark' : 'text-white'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function SearchFields({ purpose }: { purpose: Purpose }) {
  return (
    <>
      <input type="hidden" name="purpose" value={purpose} />

      <div className="flex flex-1 flex-col divide-y divide-slate-100 sm:flex-row sm:items-center sm:divide-y-0 sm:divide-x sm:divide-slate-200 sm:gap-0">
        <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5 text-left sm:rounded-none sm:py-2">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Where</span>
            <input
              name="location"
              placeholder="Lahore, DHA..."
              className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </span>
        </label>

        <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5 text-left sm:rounded-none sm:py-2">
          <Wallet className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Budget</span>
            <select
              name="budget"
              defaultValue={BUDGET_OPTIONS[0]}
              className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
            >
              {BUDGET_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </span>
        </label>

        <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5 text-left sm:rounded-none sm:py-2">
          <BedDouble className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Bedrooms</span>
            <select
              name="bedrooms"
              defaultValue={BEDROOM_OPTIONS[0]}
              className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
            >
              {BEDROOM_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </span>
        </label>

        <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5 text-left sm:rounded-none sm:py-2">
          <Home className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Type</span>
            <select
              name="type"
              defaultValue={TYPE_OPTIONS[0]}
              className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </span>
        </label>
      </div>

      <div className="flex items-center justify-center px-1 pt-1 sm:pl-2 sm:pt-0">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-heading-gradient px-7 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
        >
          <SearchIcon className="h-4 w-4" />
          Search
        </button>
      </div>
    </>
  );
}

export function Hero() {
  const [purpose, setPurpose] = useState<Purpose>('buy');

  return (
    <section className="relative">
      {/* ————————————————————————————————————————————————————————————
          Desktop (lg+) — unchanged from the original design. Kept as a
          verbatim, self-contained block (own image heights/paddings/
          overlap technique) so any responsive work below lg can never
          leak into how this renders at lg+. */}
      <div className="relative mb-16 hidden lg:block">
        <div className="pt-16 sm:pt-[68px] lg:pt-0">
          <div className="relative h-[480px] w-full overflow-hidden sm:h-[620px] md:h-[680px]">
            <Image
              src="/images/belowest-hero-image.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 flex justify-center pt-6 shrink-0 sm:pt-[150px]">
              <Image
                src="/images/jayedaad-text.png"
                alt="Jayedaad"
                width={1200}
                height={168}
                priority
                className="h-16 w-full max-w-5xl select-none opacity-90 sm:h-36"
              />
            </div>

            <Image
              src="/images/top-hero-image.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />

            <motion.div
              variants={textGroup}
              initial="hidden"
              animate="show"
              className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col pb-20 pt-28 sm:pt-[300px] md:pb-28"
            >
              <motion.p
                variants={textItem}
                className="max-w-xs text-left text-sm leading-relaxed text-white/90 sm:text-base"
              >
                Pakistan&apos;s smartest real estate platform for buying, selling and renting verified properties.
              </motion.p>

              <motion.div variants={textItem} className="flex justify-center">
                <PurposeTabs
                  purpose={purpose}
                  onChange={setPurpose}
                  layoutId="purpose-pill-desktop"
                  className="mt-12 sm:mt-[200px]"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        <motion.form
          action="/search"
          method="get"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
          className="absolute inset-x-4 -bottom-24 mx-auto flex max-w-4xl flex-col gap-3 rounded-3xl bg-white p-3 shadow-2xl sm:-bottom-16 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-2 md:-bottom-10"
        >
          <SearchFields purpose={purpose} />
        </motion.form>
      </div>

      {/* ————————————————————————————————————————————————————————————
          Mobile/tablet (below lg) — redesigned for real screen space
          instead of reusing the desktop's fixed pixel heights: the hero
          photo scales with a responsive height, the wordmark/tabs sit in
          a comfortable flex column instead of magic-number padding, and
          the search card sits in normal flow (pulled up with a negative
          margin) rather than the desktop's absolute-overlap technique,
          which only really works with a fixed-height hero. */}
      <div className="lg:hidden">
        <div className="pt-16 sm:pt-[68px]">
          <div className="relative h-[420px] w-full overflow-hidden rounded-b-[2rem] sm:h-[520px] md:h-[560px]">
            <Image
              src="/images/belowest-hero-image.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />

            <Image
              src="/images/top-hero-image.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />

            <motion.div
              variants={textGroup}
              initial="hidden"
              animate="show"
              className="relative z-10 flex h-full flex-col items-center px-5 pb-10 pt-8 text-center sm:pb-12 sm:pt-10 md:pt-12"
            >
              <Image
                src="/images/jayedaad-text.png"
                alt="Jayedaad"
                width={1200}
                height={168}
                priority
                className="h-12 w-auto max-w-[88%] select-none opacity-90 sm:h-16 md:h-20"
              />

              <motion.p
                variants={textItem}
                className="mt-4 max-w-xs text-sm leading-relaxed text-white/90 sm:mt-5 sm:max-w-sm sm:text-base"
              >
                Pakistan&apos;s smartest real estate platform for buying, selling and renting verified properties.
              </motion.p>

              <motion.div variants={textItem} className="mt-auto pt-6">
                <PurposeTabs purpose={purpose} onChange={setPurpose} layoutId="purpose-pill-mobile" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        <motion.form
          action="/search"
          method="get"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
          className="relative z-10 mx-4 -mt-8 flex flex-col gap-1 rounded-3xl bg-white p-3 shadow-2xl sm:-mt-10 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-2"
        >
          <SearchFields purpose={purpose} />
        </motion.form>

        <div className="h-10 sm:h-12" />
      </div>
    </section>
  );
}
