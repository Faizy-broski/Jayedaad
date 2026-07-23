// Shared skeleton for every route group's loading.tsx — Next.js shows this
// while a route segment's code/initial render is streaming in during
// client-side navigation. Doesn't cover in-page React Query isLoading
// states (those still need their own per-page skeleton) — this only covers
// the route-transition moment.
export function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
