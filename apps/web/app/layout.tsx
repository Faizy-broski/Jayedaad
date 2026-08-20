import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Outfit } from 'next/font/google';
import { Providers } from './providers';
import { AppChrome } from '../components/layout/AppChrome';
import './globals.css';

// Site-wide typeface — exposed as --font-sans (see tailwind.config.ts) so
// Tailwind's default `font-sans` (applied to <html> by Preflight) picks it
// up everywhere without every component needing its own font-family class.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jayedaad — Building Trust in Real Estate',
  description: 'Verified real estate marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${outfit.variable}`}>
      {/* overflow-x-clip guards against the classic `w-screen`/`100vw`
          full-bleed bug (see OfficeShowCase.tsx) — 100vw includes the
          scrollbar's own width on browsers with a classic (non-overlay)
          scrollbar, so a `w-screen` element sits a few px wider than the
          visible viewport and forces a horizontal scrollbar site-wide.
          Deliberately `clip`, not `hidden` — per the CSS Overflow spec,
          `overflow-x: hidden` with `overflow-y` left unset forces
          `overflow-y` to compute as `auto`, turning <body> into its own
          separate scroll container. Every `position: sticky` element
          anywhere in the app (e.g. PropertyFilters' filter panel) then
          sticks relative to that hijacked box instead of the real
          viewport scroll and silently stops sticking. `clip` blocks the
          same horizontal overflow without that pairing side effect. */}
      <body className="min-h-screen overflow-x-clip bg-white text-foreground font-sans">
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
