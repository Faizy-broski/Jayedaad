'use client';

import { useEffect, useState } from 'react';
import { RecentlyVisitedProperties } from './RecentlyVisitedProperties';
import { getRecentlyViewed } from '@/lib/recentlyViewed';
import type { Property } from '@/lib/types';

// Per-visitor browsing history, not a server ranking — there's no per-user
// "recently viewed" endpoint (GET /listings/trending is sitewide), so this
// reads localStorage written by PropertyDetailSection on each real listing
// view. Read in an effect (not render) since localStorage isn't available
// during SSR and must stay in sync with what this browser has actually seen.
export function RecentlyVisitedPropertiesSection() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    setProperties(getRecentlyViewed());
  }, []);

  return <RecentlyVisitedProperties properties={properties} />;
}
