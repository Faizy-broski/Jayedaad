'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, Home, RotateCcw, Wifi, ServerCrash, FileWarning } from 'lucide-react';
import { FloatingIcon } from './FloatingIcon';

const EASE = [0.16, 1, 0.3, 1] as const;

// Shared error boundary UI for every route group's error.tsx. Next.js
// requires error.tsx files to be Client Components (they need `reset` to
// re-render the segment) and to sit in the file itself — this component is
// the shared markup each error.tsx delegates to.
//
// Fixed full-screen overlay, same rationale as RouteLoading — this replaces
// whatever chrome (Header/Footer, or an agent/admin shell) the segment
// would normally sit inside, rather than rendering awkwardly nested in it.
export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // No-op if NEXT_PUBLIC_SENTRY_DSN was never set (sentry.client.config.ts
  // skips Sentry.init() entirely in that case).
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <FloatingIcon icon={ServerCrash} className="absolute left-[8%] top-[18%] h-10 w-10 text-destructive/10" duration={7} />
        <FloatingIcon icon={Wifi} className="absolute right-[12%] top-[24%] h-8 w-8 text-primary/10" duration={6.5} delay={0.5} />
        <FloatingIcon icon={FileWarning} className="absolute left-[14%] bottom-[20%] h-9 w-9 text-primary/10" duration={8} delay={1} />
        <FloatingIcon icon={AlertTriangle} className="absolute right-[10%] bottom-[16%] h-10 w-10 text-destructive/10" duration={7.5} delay={0.3} />
      </div>

      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-col items-center gap-4"
        >
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
          >
            <AlertTriangle className="h-6 w-6" />
          </motion.span>

          {/* text-foreground, not text-brand-dark — see not-found.tsx's
              identical fix: --brand-dark stays near-black in dark mode too,
              which would make this heading invisible against bg-background. */}
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-full bg-heading-gradient px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Home className="h-4 w-4" />
              Back to homepage
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
