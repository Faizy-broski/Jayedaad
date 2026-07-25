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

export function Hero() {
  const [purpose, setPurpose] = useState<Purpose>('buy');

  return (
    <section className="relative mb-16">
      <div className="relative h-[560px] w-full overflow-hidden sm:h-[620px] md:h-[680px]">
        <Image
          src="/images/belowest-hero-image.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 flex justify-center pt-8 shrink-0 sm:pt-[150px]">
          <Image
            src="/images/jayedaad-text.png"
            alt="Jayedaad"
            width={1200}
            height={168}
            priority
            className="h-36 w-full max-w-5xl select-none opacity-90"
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
          className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col pb-20 pt-44 sm:pt-[300px] md:pb-28"
        >
          <motion.p
            variants={textItem}
            className="max-w-xs text-left text-sm leading-relaxed text-white/90 sm:text-base"
          >
            Pakistan&apos;s smartest real estate platform for buying, selling and renting verified properties.
          </motion.p>

          <motion.div
            variants={textItem}
            className="pointer-events-auto mt-[200px] inline-flex items-center gap-1 self-center rounded-full border border-white/25 bg-white/10 p-1 backdrop-blur-md"
          >
            {PURPOSE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setPurpose(tab.value)}
                className="relative rounded-full px-6 py-2 text-sm font-medium transition-colors"
              >
                {purpose === tab.value && (
                  <motion.span
                    layoutId="purpose-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 ${purpose === tab.value ? 'text-brand-dark' : 'text-white'}`}>
                  {tab.label}
                </span>
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Search bar — single white pill on sm+, stacked rounded card on mobile.
          Each field is icon + stacked (label/value), divided by thin borders,
          with the green pill Search button flush against the right edge. */}
     <motion.form
        action="/search"
        method="get"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
        className="absolute inset-x-4 -bottom-24 mx-auto flex max-w-4xl flex-col gap-3 rounded-3xl bg-white p-3 shadow-2xl sm:-bottom-16 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-2 md:-bottom-10"
      >
        <input type="hidden" name="purpose" value={purpose} />

        {/* Divider only lives between these four fields — wrapping them
            separately from the Search button keeps divide-x from also
            drawing a line right before the button. */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-slate-200">
          <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2 text-left sm:rounded-none sm:px-5">
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

          <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2 text-left sm:rounded-none sm:px-5">
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

          <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2 text-left sm:rounded-none sm:px-5">
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

          <label className="flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2 text-left sm:rounded-none sm:px-5">
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

        <div className="flex items-center justify-center px-1 sm:pl-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <SearchIcon className="h-4 w-4" />
            Search
          </button>
        </div>
      </motion.form>
    </section>
  );
}