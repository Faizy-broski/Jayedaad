// Lazily injects the Google Maps JS API (Places library) script once and
// resolves when window.google.maps.places is ready. Requires a real API key
// with the Places API enabled in the Google Cloud Console (billing account
// required) — set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY in .env. Without a key,
// callers should fall back to a plain input (see PlacesAutocompleteInput.tsx).
let loadPromise: Promise<typeof google> | null = null;

export function loadGooglePlaces(apiKey: string): Promise<typeof google> {
  if (typeof window === 'undefined') return Promise.reject(new Error('loadGooglePlaces is client-only'));
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if (window.google?.maps?.places) resolve(window.google);
      else reject(new Error('Google Maps script loaded but places library is unavailable'));
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}
