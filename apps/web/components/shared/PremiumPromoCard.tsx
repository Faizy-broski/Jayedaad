import Image from 'next/image';
import Link from 'next/link';
import { Crown } from 'lucide-react';

// Agent-facing upsell to the paid plan (/plan — real Stripe-checkout
// destination, see (agent)/plan/page.tsx). Root cause of every earlier
// "photo isn't showing" attempt: explore-bg.png is a TRANSPARENT-background
// cutout PNG (a villa render with the surrounding area punched out to
// alpha), not a rectangular photo — confirmed by opening the file.
// Stretched full-bleed with object-cover as a "photo behind a tint", its
// transparent regions just showed whatever solid color sat behind it,
// which is why it always read as a flat green card regardless of overlay
// opacity. Fixed: the #034B37 -> #011B14 gradient is the actual base fill
// (opaque, covers the whole card), and the villa cutout sits on top in a
// corner at its own aspect ratio (object-contain, not object-cover, sized
// and positioned rather than filled) — same treatment the reference
// screenshots actually show (the house bleeding out of one corner, not
// filling the card). Corner radius 25, clip content on — carried over 1:1.
export function PremiumPromoCard({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[25px] bg-gradient-to-br from-[#034B37] to-[#011B14] ${className ?? ''}`}>
      <div className="pointer-events-none absolute -bottom-4 -right-5 h-[190px] w-[220px]">
        <Image src="/images/explore-bg.png" alt="" fill className="object-contain object-right-bottom" priority={false} />
      </div>

      <div className="relative flex flex-col gap-3 p-6 sm:p-7">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          <Crown className="h-3.5 w-3.5" />
          Jayedaad Premium
        </span>

        <h3 className="max-w-[80%] text-2xl font-bold leading-tight text-white sm:text-[26px]">
          Get listings 48 hours before everyone else.
        </h3>

        <p className="max-w-[78%] text-sm text-white/70">Priority tours, dedicated advisor and zero platform fees.</p>

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
