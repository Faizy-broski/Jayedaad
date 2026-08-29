'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Home, Search, MapPin, Compass, Building2 } from 'lucide-react';
import { FloatingIcon } from '@/components/FloatingIcon';

const EASE = [0.16, 1, 0.3, 1] as const;

const group = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

// Fixed full-screen overlay, same rationale as RouteLoading/RouteError —
// this replaces whatever chrome (Header/Footer, or an agent/admin shell)
// the requested URL would normally sit inside, rather than rendering
// awkwardly nested in it.
export default function NotFound() {
  return (
    <main className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-background px-4">
      {/* Faint building watermark, same treatment used across the site's
          light sections, so a 404 still reads as unmistakably "Jayedaad". */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
        <Image
          src="/images/bg-image.png"
          alt=""
          width={1085}
          height={1150}
          className="h-auto w-[70%] max-w-xl object-contain"
        />
      </div>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <FloatingIcon icon={Compass} className="absolute left-[10%] top-[16%] h-11 w-11 text-primary/10" duration={7} />
        <FloatingIcon icon={MapPin} className="absolute right-[12%] top-[22%] h-9 w-9 text-primary/10" duration={6} delay={0.6} />
        <FloatingIcon icon={Building2} className="absolute left-[14%] bottom-[18%] h-10 w-10 text-primary/10" duration={8} delay={0.2} />
        <FloatingIcon icon={Search} className="absolute right-[10%] bottom-[14%] h-9 w-9 text-primary/10" duration={7.5} delay={1} />
      </div>

      <motion.div
        variants={group}
        initial="hidden"
        animate="show"
        className="relative z-10 flex max-w-lg flex-col items-center gap-5 text-center"
      >
        <motion.span
          variants={item}
          className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient"
        >
          Wrong turn
        </motion.span>

        <motion.h1
          variants={item}
          className="text-heading-gradient text-7xl font-black leading-none sm:text-8xl"
        >
          404
        </motion.h1>

        {/* text-foreground, not text-brand-dark — --brand-dark is a fixed
            near-black used for deliberate dark sections/banners and stays
            near-black in dark mode too (see globals.css), which would make
            this heading invisible against a dark page background. */}
        <motion.h2 variants={item} className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          This address doesn&apos;t exist.
        </motion.h2>

        <motion.p variants={item} className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          The page you&apos;re looking for may have been moved, renamed, or never listed in the first place.
          Let&apos;s get you back to somewhere real.
        </motion.p>

        <motion.div variants={item} className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-heading-gradient px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            Back to homepage
          </Link>
          <Link
            href="/listings"
            className="flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Search className="h-4 w-4" />
            Browse properties
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
