import Image from 'next/image';
import Link from 'next/link';
import { Home } from 'lucide-react';
import type { ReactNode } from 'react';

const TRUST_AVATARS = ['/images/auth/avatar-1.jpg', '/images/auth/avatar-2.jpg', '/images/auth/avatar-3.jpg'];

interface AuthShellProps {
  heroImage?: string;
  heroAlt?: string;
  heroEyebrow: string;
  heroTitle: ReactNode;
  /** The "Trusted by discerning homeowners…" avatar row — only /login and /signup want it. */
  showTrustRow?: boolean;
  /** Width cap for the right-column content — signup's wider form needs max-w-md, everything else is max-w-sm. */
  rightMaxWidth?: string;
  /** Vertical padding on the right column's scroll container — signup's longer form needs less breathing room. */
  rightPadding?: string;
  /** Gap between blocks in the right column — signup packs tighter than the shorter single-purpose forms. */
  rightGap?: string;
  children: ReactNode;
}

// Shared split-screen shell for every /(auth) route (login, signup,
// forgot-password, reset-password, verify-email) — was previously
// duplicated markup (Home escape link, framed hero photo + logo + welcome
// copy on the left, scrollable form column on the right) copy-pasted five
// times with only the copy/props actually differing between pages.
//
// The hero panel is inset with a page-level gap (`p-4` below) and rounded
// corners rather than full-bleed to the viewport edge, so the photo reads
// as a framed card floating on the page. `<main>` uses the bg-background
// token (not a hardcoded bg-white) so it flips dark in dark mode along with
// every form control inside (Input/Select/Checkbox/Label all use theme
// tokens too) — a hardcoded-white shell with dark-mode-colored children
// painted on top was the actual cause of the "disturbed" dark-mode signup
// page (washed-out labels + near-invisible input boxes) fixed alongside this.
//
// Right column centering: `my-auto` on the inner child, NOT `items-center`
// on this flex container — align-items centering clips the TOP half
// unreachably when a flex child overflows an `overflow-y-auto` parent
// (scrollTop can't go negative). `margin:auto` centering doesn't have that
// bug: it collapses to 0 instead of clipping. `overflow-y-auto` itself is a
// fallback for very short viewports.
export function AuthShell({
  heroImage = '/images/login-bg.png',
  heroAlt = 'A curated Jayedaad home overlooking the coast',
  heroEyebrow,
  heroTitle,
  showTrustRow = false,
  rightMaxWidth = 'max-w-sm',
  rightPadding = 'py-10',
  rightGap = 'space-y-6',
  children,
}: AuthShellProps) {
  return (
    <main className="relative grid h-screen gap-4 overflow-hidden bg-background p-4 lg:grid-cols-12">
      {/* Escape hatch back to the marketing site — AppChrome deliberately
          omits Header/Footer on auth routes (see AppChrome.tsx), so this is
          the only way back without hitting the browser back button. */}
      <Link
        href="/"
        className="absolute right-6 top-6 z-20 flex items-center gap-1.5 rounded-full border border-input bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur hover:bg-background"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>

      {/* Left: hero image + welcome copy — hidden on mobile/tablet. */}
      <div className="relative hidden overflow-hidden rounded-3xl col-span-7 lg:block bg-slate-400">
        <Image src={heroImage} alt={heroAlt} fill priority className="object-cover" />
        {/* Bottom-weighted scrim so the white overlay text stays readable
            against whatever's in the photo, without darkening the top. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        <div className="absolute left-8 top-8">
          <Image
            src="/images/jayedaad-white-logo.svg"
            alt="Jayedaad"
            width={100}
            height={120}
            className="h-16 w-auto"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-4 p-10">
          <span className="eyebrow-label text-white/70">{heroEyebrow}</span>
          <h1 className="heading-display uppercase leading-[1.1] text-white">{heroTitle}</h1>

          {showTrustRow && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-3">
                {TRUST_AVATARS.map((src) => (
                  <div key={src} className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white">
                    <Image src={src} alt="" fill className="object-cover" sizes="36px" />
                  </div>
                ))}
              </div>
              <p className="body-text-sm text-white/80">
                Trusted by discerning homeowners
                <br />
                across 40+ cities worldwide.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: page-specific form content. no-scrollbar hides the
          scrollbar itself — overflow-y-auto stays (still the short-viewport
          fallback described above), it just no longer renders visibly. */}
      <div className={`no-scrollbar flex justify-center overflow-y-auto px-6 ${rightPadding} col-span-5 sm:px-12`}>
        <div className={`my-auto w-full ${rightMaxWidth} ${rightGap}`}>{children}</div>
      </div>
    </main>
  );
}
