// Extracted from apps/web/app/(agent)/crm/page.tsx, which had this as a
// local helper — now reused by ActivityTimeline.tsx too (Phase 2 of the
// CRM maturity build-out), so it moved here rather than staying duplicated.
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
