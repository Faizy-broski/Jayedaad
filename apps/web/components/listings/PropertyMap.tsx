'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Bed, Bath, Ruler } from 'lucide-react';
import type { ListingProperty } from '@/lib/types';

// Same env var as PlacesAutocompleteInput.tsx/lib/env.ts — one Google Cloud
// API key with both the Maps JavaScript API and Places API enabled on it,
// not two separate keys (was previously a naming drift: this file alone
// read NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, which nothing else set/documented).
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

// Roughly centers on Pakistan when no listings are selected/zoomed to.
const DEFAULT_CENTER = { lat: 30.3753, lng: 69.3451 };
const DEFAULT_ZOOM = 5;

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
};

interface PropertyMapProps {
  properties: ListingProperty[];
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'jayedaad-google-map',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(() => properties.find((p) => p.id === activeId) ?? null, [properties, activeId]);

  const center = useMemo(() => {
    if (properties.length === 0) return DEFAULT_CENTER;
    const lat = properties.reduce((sum, p) => sum + p.lat, 0) / properties.length;
    const lng = properties.reduce((sum, p) => sum + p.lng, 0) / properties.length;
    return { lat, lng };
  }, [properties]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-[520px] w-full items-center justify-center rounded-3xl border border-dashed border-border bg-muted p-8 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Map view needs a Google Maps API key. Set{' '}
          <code className="rounded bg-background px-1 py-0.5 text-xs">NEXT_PUBLIC_GOOGLE_PLACES_API_KEY</code> in your
          environment to enable it.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[520px] w-full items-center justify-center rounded-3xl border border-dashed border-border bg-muted p-8 text-center">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load Google Maps. Please try again later.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="h-[520px] w-full animate-pulse rounded-3xl bg-muted" />;
  }

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-3xl border border-border shadow-sm">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={properties.length === 1 ? { lat: properties[0].lat, lng: properties[0].lng } : center}
        zoom={properties.length === 1 ? 12 : DEFAULT_ZOOM}
        options={MAP_OPTIONS}
      >
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={{ lat: property.lat, lng: property.lng }}
            onClick={() => setActiveId(property.id)}
          />
        ))}

        {active && (
          <InfoWindow
            position={{ lat: active.lat, lng: active.lng }}
            onCloseClick={() => setActiveId(null)}
          >
            <div className="w-52">
              <div className="relative h-28 w-full overflow-hidden rounded-lg">
                <Image src={active.image} alt={active.title} fill sizes="208px" className="object-cover" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{active.title}</p>
              <p className="text-xs text-slate-500">{active.location}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{active.price}</p>
              <div className="mt-1.5 flex gap-2.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  {active.beds}
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  {active.baths}
                </span>
                <span className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  {active.areaSqft.toLocaleString()} sqft
                </span>
              </div>
              <Link
                href={`/listings/${active.id}`}
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
              >
                View Details
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
