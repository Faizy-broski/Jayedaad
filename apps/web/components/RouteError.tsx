'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Shared error boundary UI for every route group's error.tsx. Next.js
// requires error.tsx files to be Client Components (they need `reset` to
// re-render the segment) and to sit in the file itself — this component is
// the shared markup each error.tsx delegates to.
export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col items-center gap-4"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </span>

        <h2 className="text-xl font-bold text-brand-dark">Something went wrong</h2>
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
            className="flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary"
          >
            <Home className="h-4 w-4" />
            Back to homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
