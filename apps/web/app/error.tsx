'use client';

import { RouteError } from '@/components/RouteError';

// Catch-all for the root layout's children — anything not already caught by
// a more specific route group's own error.tsx bubbles up here instead of
// showing Next.js's default unstyled error screen.
export default RouteError;
