// One anonymous id per browser tab session, used to group a single visitor's
// engagement events (see listingsRepository.trackEngagement) — generated
// once and persisted in sessionStorage so repeated actions in the same tab
// share one id, but a fresh tab/visit gets a new one.
const STORAGE_KEY = 'jayedaad-viewer-session-id';

export function getViewerSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEY, id);
  return id;
}
