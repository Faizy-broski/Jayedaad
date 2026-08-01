'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

// Shared UI for every route group's loading.tsx — Next.js shows this while
// a route segment's code/initial render is streaming in during client-side
// navigation. Doesn't cover in-page React Query isLoading states (those
// still need their own per-page skeleton) — this only covers the
// route-transition moment.
//
// Fixed full-screen overlay (not an inline block) so it's shown *instead
// of* whatever chrome the destination route would normally have — the
// public site's Header/Footer, or an agent/admin shell's sidebar — rather
// than flashing inside them mid-navigation.
export function RouteLoading() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-8 bg-background" role="status" aria-label="Loading">
      <div className="relative flex h-32 w-32 items-center justify-center">
        {/* Soft pulsing glow behind the mark */}
        <motion.div
          className="absolute h-28 w-28 rounded-full bg-primary/20 blur-2xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Rotating brand-gradient ring */}
        <motion.div
          className="absolute h-24 w-24 rounded-full border-2 border-transparent"
          style={{ borderTopColor: 'hsl(var(--primary))', borderRightColor: 'hsl(var(--brand-emerald))' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />
        {/* The logo itself — fades/scales in once, then breathes gently */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: [0.96, 1.03, 0.96] }}
          transition={{
            opacity: { duration: 0.4 },
            scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
          }}
          className="relative z-10"
        >
          <Image src="/images/jayedaad-logo.png" alt="Jayedaad" width={160} height={45} priority className="h-11 w-auto object-contain" />
        </motion.div>
      </div>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  );
}
