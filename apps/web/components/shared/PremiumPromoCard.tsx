import Image from 'next/image';
import Link from 'next/link';
import { Crown } from 'lucide-react';

// Agent-facing upsell to the paid plan (/plan — real Stripe-checkout
// destination, see (agent)/plan/page.tsx) — reuses explore-bg.png (already
// used full-bleed on the public homepage's WhereWeLive section). The Figma
// layer panel's literal numbers (Image 11% on top of an opaque Linear 100%
// base) render as a solid green card with no visible photo at all on
// device — 11% blended over a fully opaque base is imperceptible,
// confirmed. Flipped instead: the photo is the full-opacity base layer,
// and the #034B37 -> #011B14 gradient sits on top as a translucent wash
// (not opaque stops) — same two colors, same dominant-green result, but
// the photo stays genuinely visible underneath rather than only in theory.
// Corner radius 25, clip content on — both carried over 1:1.
export function PremiumPromoCard({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[25px] ${className ?? ''}`}>
      <Image
        src="/images/explore-bg.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 640px, 100vw"
        className="object-cover"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(3,75,55,0.45)] to-[rgba(1,27,20,0.55)]" />
      {/* Lighter color wash above means the photo underneath can be bright
          in spots — this keeps the text column readable regardless,
          independent of however dim/visible the green tint ends up. */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,0,0,0.55)] via-[rgba(0,0,0,0.15)] to-transparent" />

      <div className="relative flex flex-col gap-3 p-6 sm:p-7">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          <Crown className="h-3.5 w-3.5" />
          Jayedaad Premium
        </span>

        <h3 className="max-w-xs text-2xl font-bold leading-tight text-white sm:text-[26px]">
          Get listings 48 hours before everyone else.
        </h3>

        <p className="max-w-sm text-sm text-white/70">Priority tours, dedicated advisor and zero platform fees.</p>

        <Link
          href="/plan"
          className="mt-2 inline-flex w-fit items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition-opacity hover:opacity-90"
        >
          Try free for 14 days
        </Link>
      </div>
    </div>
  );
}
