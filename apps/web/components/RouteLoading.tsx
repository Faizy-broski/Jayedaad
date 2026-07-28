'use client';

import { motion } from 'framer-motion';

// Shared skeleton for every route group's loading.tsx — Next.js shows this
// while a route segment's code/initial render is streaming in during
// client-side navigation. Doesn't cover in-page React Query isLoading
// states (those still need their own per-page skeleton) — this only covers
// the route-transition moment.
export function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status" aria-label="Loading">
      <div className="relative h-10 w-10">
        {/* Static track */}
        <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
        {/* Spinning brand-gradient arc */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: '#0d634b',
            borderRightColor: '#0d634b',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        Loading
      </motion.span>
    </div>
  );
}
