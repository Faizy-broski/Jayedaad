'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

const LIST_A_HOME_CLASSES =
  'rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90';

const NAV_LINKS = [
  { label: 'Buy & Sell', href: '/search?purpose=sale' },
  { label: 'Rent', href: '/search?purpose=rent' },
  { label: 'About', href: '#' },
  { label: 'Commercial', href: '/search?type=commercial' },
  { label: 'Agents', href: '#' },
  { label: 'Services', href: '#' },
  { label: 'Contact', href: '#' },
];

// On the homepage the navbar floats over the hero (absolute, margin, rounded,
// capped width) and snaps to a flush fixed bar once the user scrolls past it.
// Every other route keeps the plain in-flow sticky bar — those pages have no
// hero for it to float over, so overlapping would just hide their content.
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

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`transition-[top,margin,border-radius,box-shadow] duration-300 ${
        isHome ? (scrolled ? ATTACHED_CLASSES : FLOATING_CLASSES) : STATIC_CLASSES
      } ${isHome && !scrolled ? (mobileOpen ? 'rounded-3xl' : 'rounded-full') : ''}`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 sm:px-6 ${
          isHome && !scrolled ? 'w-full' : 'mx-auto w-full max-w-7xl'
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-all hover:scale-110 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <Link href="/submit" className={LIST_A_HOME_CLASSES}>
            List a home
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 lg:hidden"
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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-3 border-t border-slate-200 px-2 pt-3">
              <Link href="/login" className="text-sm font-medium text-slate-600" onClick={() => setMobileOpen(false)}>
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
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
