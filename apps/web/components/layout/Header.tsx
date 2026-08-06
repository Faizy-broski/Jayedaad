'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthViewModel } from '@jayedaad/core';

const LIST_A_HOME_CLASSES =
  'rounded-full bg-heading-gradient px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90';

const NAV_LINKS = [
  { label: 'Buy & Sell', href: '/search?purpose=sale' },
  { label: 'Rent', href: '/search?purpose=rent' },
  { label: 'About', href: '/about-us' },
  // { label: 'Commercial', href: '/search?type=commercial' },
  { label: 'Agents', href: '#' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact-us' },
];

// Matches a nav link against the current URL — pathname must match exactly,
// and if the link carries query params (the /search variants), every one of
// those must also match the current search params, so "Buy & Sell" and
// "Rent" don't both light up just because they share a pathname.
function useIsLinkActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (href: string) => {
    if (href === '#') return false;
    const [linkPath, linkQuery] = href.split('?');
    if (linkPath !== pathname) return false;
    if (!linkQuery) return !searchParams.toString();
    const linkParams = new URLSearchParams(linkQuery);
    for (const [key, value] of linkParams) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  };
}

// On pages with a hero (home, about-us, contact-us, services, listings) the
// navbar floats over it (absolute, margin, rounded, capped width) and snaps
// to a flush fixed bar once the user scrolls past it. Routes without a hero
// (auth, dashboards, etc.) keep the plain in-flow sticky bar — there's
// nothing for it to float over there, so overlapping would just hide content.
//
// The floating effect is desktop-only (lg+). Below that there's no room for
// a pill-shaped bar with margins to look right, and mobile heroes are short
// enough that a floating bar reads as glitchy rather than premium — so on
// mobile/md the header is always the flush, attached bar, regardless of
// scroll position.
//
// Centered with inset-x-0 + mx-auto rather than the left-1/2 -translate-x-1/2
// trick — framer-motion drives this element's `transform` inline for the
// mount fade-in, and an inline style always wins over Tailwind's transform
// utility class, which silently drops the centering translate.
//
// Bg is a hardcoded bg-white (not the --background/--card tokens) so the bar
// always reads the same regardless of the site's light/dark theme. Every
// text/border color in this file is hardcoded neutral slate for the same
// reason — the theme-following `text-foreground`/`border-border` tokens flip
// to near-white in dark mode, which would go invisible against a bar that
// never itself goes dark.
// rounded-full only while closed — once the mobile dropdown expands the
// bar's height, a full pill radius balloons into a lens/blob shape that
// clips the menu content, so it drops to a fixed rounded-3xl instead.
const FLOATING_CLASSES =
  'absolute inset-x-4 top-4 z-50 mx-auto max-w-6xl border border-slate-200 bg-white shadow-lg sm:top-6';
const ATTACHED_CLASSES =
  'fixed inset-x-0 top-0 z-50 w-full rounded-none border-b border-slate-200 bg-white shadow-sm';
const STATIC_CLASSES = 'sticky top-0 z-50 w-full rounded-none border-b border-slate-200 bg-white';

// Tailwind's lg breakpoint (1024px) — kept in sync with the lg: prefixes
// used elsewhere in this file for the nav/menu switch.
const DESKTOP_QUERY = '(min-width: 1024px)';

// Routes whose first section is a full-bleed hero (Hero/PageHero/SearchHero)
// for the floating bar to overlap. Everything else (auth, dashboards, etc.)
// keeps the plain in-flow sticky bar.
const HERO_ROUTES = new Set(['/', '/about-us', '/contact-us', '/services', '/listings']);

// Listing/project detail pages (/listings/[slug], /developments/[slug]) have
// no hero banner, but still get the floating treatment — PropertyDetail/
// ProjectDetail reserve top clearance themselves (rather than a hero
// backdrop) so the pill doesn't sit over the breadcrumb.
function isHeroRoute(pathname: string): boolean {
  return HERO_ROUTES.has(pathname) || pathname.startsWith('/listings/') || pathname.startsWith('/developments/');
}

export function Header() {
  return (
    <Suspense fallback={<div className={`${STATIC_CLASSES} h-[68px] sm:h-[76px]`} />}>
      <HeaderInner />
    </Suspense>
  );
}

// Mirrors apps/web/app/(auth)/login/page.tsx's DEFAULT_LANDING_BY_ROLE —
// same duplication convention already used there, in
// verify-email/page.tsx, and in auth/callback/route.ts. Used here for the
// signed-in user menu's "Dashboard" link.
const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/admin/dashboard',
  verification_staff: '/verification',
  agent: '/dashboard',
  owner: '/submit',
  buyer: '/search',
};

function HeaderInner() {
  const router = useRouter();
  const { isAuthenticated, user, role, signOut } = useAuthViewModel();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isLinkActive = useIsLinkActive();
  const hasHero = isHeroRoute(pathname);

  const displayName = (user?.user_metadata?.display_name as string | undefined) || user?.email || 'Account';
  const initials = displayName.slice(0, 2).toUpperCase();
  const dashboardHref = DEFAULT_LANDING_BY_ROLE[role ?? ''] || '/search';

  function handleLogout() {
    setUserMenuOpen(false);
    setMobileOpen(false);
    signOut.mutate(undefined, { onSuccess: () => router.push('/') });
  }

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!hasHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasHero]);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Floating only ever applies on desktop, on hero routes, before scrolling.
  const isFloating = hasHero && isDesktop && !scrolled;

  const headerClasses = !hasHero ? STATIC_CLASSES : isFloating ? FLOATING_CLASSES : ATTACHED_CLASSES;

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`transition-[top,margin,border-radius,box-shadow] duration-300 ${headerClasses} ${
        isFloating ? (mobileOpen ? 'rounded-3xl' : 'rounded-full') : ''
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 sm:px-6 ${
          isFloating ? 'w-full' : 'mx-auto w-full max-w-7xl'
        }`}
      >
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/images/jayedaad-logo.png"
            alt="Jayedaad"
            width={160}
            height={45}
            priority
            className="h-10 w-auto sm:h-11"
          />
        </Link>

        <nav className="hidden items-center gap-5 xl:gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative py-1 text-sm font-medium transition-colors duration-200 hover:text-slate-900 ${
                  active ? 'text-heading-gradient font-semibold' : 'text-slate-600'
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-heading-gradient transition-transform duration-300 ease-out ${
                    active ? 'scale-x-100' : 'group-hover:scale-x-100'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {isAuthenticated ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {initials}
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full z-10 mt-2 w-56 origin-top-right overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"
                  >
                    <p className="truncate px-3 py-2 text-sm font-medium text-slate-900">{displayName}</p>
                    <Link
                      href={dashboardHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={signOut.isPending}
                      className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {signOut.isPending ? 'Logging out…' : 'Log out'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900">
              Sign in
            </Link>
          )}
          <Link href="/submit" className={LIST_A_HOME_CLASSES}>
            List a home
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 transition-colors duration-200 hover:bg-slate-100 lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.nav
            key="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-1 overflow-hidden border-t border-slate-200 px-4 py-3 lg:hidden"
          >
            {NAV_LINKS.map((link, index) => {
              const active = isLinkActive(link.href);
              return (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors duration-200 ${
                      active ? 'bg-primary/10 text-heading-gradient font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-heading-gradient" />}
                    {link.label}
                  </Link>
                </motion.div>
              );
            })}
            {isAuthenticated ? (
              <div className="mt-2 space-y-1 border-t border-slate-200 px-2 pt-3">
                <p className="truncate px-0 py-1 text-sm font-medium text-slate-900">{displayName}</p>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-0 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={signOut.isPending}
                    className="text-sm font-medium text-red-600 disabled:opacity-50"
                  >
                    {signOut.isPending ? 'Logging out…' : 'Log out'}
                  </button>
                  <Link href="/submit" onClick={() => setMobileOpen(false)} className={`ml-auto ${LIST_A_HOME_CLASSES}`}>
                    List a home
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-3 border-t border-slate-200 px-2 pt-3">
                <Link href="/login" className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900" onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
                <Link
                  href="/submit"
                  onClick={() => setMobileOpen(false)}
                  className={`ml-auto ${LIST_A_HOME_CLASSES}`}
                >
                  List a home
                </Link>
              </div>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}