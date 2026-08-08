'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@jayedaad/ui-web';
import { getClientEnv } from '@/lib/env';
import { loadGooglePlaces } from '@/lib/googlePlaces';

// Real Google Places Autocomplete — NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is set
// (apps/web/.env), so this is live everywhere it's used, not a fallback
// stub. Still degrades to a plain text input if the key/script load ever
// fails (network issue, key revoked, etc.), so the field stays usable
// either way. Restricted to Pakistan only, not scoped to the selected City
// — that would need a geocoded lat/lng per city to bias results, which
// this app doesn't have.
export function PlacesAutocompleteInput({
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(false);
  const apiKey = getClientEnv().googlePlacesApiKey;

  // Latest onChange in a ref so the load effect below doesn't need it as a
  // dependency (it would tear down/rebuild the Autocomplete instance on
  // every parent re-render otherwise, since onChange is a fresh closure
  // each time `form` state updates).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;
    let cancelled = false;

    loadGooglePlaces(apiKey)
      .then((g) => {
        if (cancelled || !inputRef.current) return;
        // Pakistan-only, area/locality-level results — matches this app's
        // PKR/+92-only convention of scoping everything to Pakistan.
        autocompleteRef.current = new g.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'pk' },
          types: ['geocode'],
          fields: ['name', 'formatted_address'],
        });
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          const name = place?.name ?? place?.formatted_address;
          if (name) onChangeRef.current(name);
        });
        setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return (
    <Input
      ref={inputRef}
      required={required}
      disabled={disabled}
      className={className}
      placeholder={ready ? placeholder : `${placeholder ?? ''} (type freely — suggestions unavailable)`.trim()}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
