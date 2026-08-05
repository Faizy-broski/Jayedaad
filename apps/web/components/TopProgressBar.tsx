'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Imperative escape hatch — call from anywhere (e.g. right before an async
// router.push in a submit handler) to show the bar without waiting for the
// automatic <a>-click / history.pushState detection below. Not required for
// plain <Link> clicks or router.push()/router.replace() calls — both of
// those are already covered automatically (see patchHistoryOnce).
type Listener = () => void;
const listeners = new Set<Listener>();
export function startTopProgress() {
  listeners.forEach((l) => l());
}

let patched = false;
// Patches history.pushState/replaceState exactly once so *every* client-side
// navigation this app makes — next/link clicks, router.push(), router.replace()
// from anywhere (the sign-in redirect, admin logout, a table row's "View",
// etc.) — starts the bar, without touching each call site. The App Router
// itself calls these two under the hood for every client-side transition.
function patchHistoryOnce() {
  if (patched || typeof window === 'undefined') return;
  patched = true;
  const originalPush = window.history.pushState.bind(window.history);
  const originalReplace = window.history.replaceState.bind(window.history);
  window.history.pushState = ((...args: Parameters<typeof window.history.pushState>) => {
    startTopProgress();
    return originalPush(...args);
  }) as typeof window.history.pushState;
  window.history.replaceState = ((...args: Parameters<typeof window.history.replaceState>) => {
    startTopProgress();
    return originalReplace(...args);
  }) as typeof window.history.replaceState;
}

// Filters a click down to "this is a plain left-click on a same-origin,
// same-tab <a href> that will actually navigate" — modified clicks
// (ctrl/cmd/shift/middle-click), external links, #anchors, mailto:/tel:,
// download links, and target="_blank" all fall through untouched.
function isInternalNavClick(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const anchor = (e.target as HTMLElement | null)?.closest?.('a');
  if (!anchor) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
  } catch {
    return false;
  }
  return true;
}

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const growTimer = useRef<ReturnType<typeof setInterval>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    patchHistoryOnce();

    const start = () => {
      clearTimeout(hideTimer.current);
      clearInterval(growTimer.current);
      setVisible(true);
      setWidth(15);
      // Creeps toward 85% while the real navigation is still in flight —
      // slows the closer it gets so it never visibly stalls at a fixed
      // number (same trick NProgress/YouTube's bar use).
      growTimer.current = setInterval(() => {
        setWidth((w) => (w >= 85 ? w : w + (85 - w) * 0.1));
      }, 200);
    };

    listeners.add(start);
    const onClick = (e: MouseEvent) => {
      if (isInternalNavClick(e)) start();
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', start);

    return () => {
      listeners.delete(start);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', start);
      clearInterval(growTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  // The URL actually changed — the navigation landed. Snap to 100%, hold
  // briefly so the fill is visible, then fade out and reset for next time.
  useEffect(() => {
    clearInterval(growTimer.current);
    setWidth((w) => (w > 0 ? 100 : w));
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 250);
    return () => clearTimeout(hideTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]" role="status" aria-label="Page loading">
      <div
        className="bg-heading-gradient h-full shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// Thin top-of-viewport progress bar that starts filling the instant a
// navigation begins (link click, router.push/replace, back/forward) instead
// of only once the destination route has fully rendered — the fullscreen
// per-route loading.tsx (RouteLoading) only appears once the App Router has
// something to suspend on, which is often invisible on an already-prefetched
// link; this bar gives immediate feedback on every click regardless.
export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
