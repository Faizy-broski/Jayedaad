'use client';

import { Button } from '@jayedaad/ui-web';

// Shared error boundary UI for every route group's error.tsx. Next.js
// requires error.tsx files to be Client Components (they need `reset` to
// re-render the segment) and to sit in the file itself — this component is
// the shared markup each error.tsx delegates to.
export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
