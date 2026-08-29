import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, Bed, Bath, Ruler, Phone, ArrowRight } from 'lucide-react';
import type { ComingProject } from '@/lib/types';

export function ComingProjectBanner({ project }: { project: ComingProject }) {
  const {
    title,
    location,
    areaName,
    price,
    image,
    mapImage,
    beds,
    baths,
    areaSqft,
    agent,
    href,
  } = project;

  return (
    // Below sm, the overlay footer (location/stats + agent/CTA) needs more
    // vertical room than a fixed-aspect image can spare without colliding
    // with the price badge/mini-map, so it flows as a normal block below the
    // image instead of overlaying it. From sm up there's enough width for
    // everything to fit in one row, so it reverts to the absolute overlay.
    // bg-card, not bg-white — from sm up this is fully covered by the
    // absolute-positioned image below and never shows, but below sm the
    // "Bottom content" block flows in normal document order underneath
    // the image, so this IS the visible page-surface background behind it
    // there. Every badge/panel overlaid directly on the photo itself
    // (price badge, bookmark, mini-map, the location/agent panels) stays
    // hardcoded light on purpose — same "glass chrome over a photo reads
    // the same regardless of theme" treatment as PropertyCard's badges,
    // since their text is tuned for a light backing, not the page's
    // --foreground.
    <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm sm:aspect-[16/9] sm:rounded-3xl sm:shadow-none">
      <div className="relative aspect-[4/3] w-full sm:absolute sm:inset-0 sm:aspect-auto">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 1280px) 1152px, (min-width: 640px) 90vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* Top row — price badge and bookmark share one flex row so they
          align on the same baseline regardless of how many digits the
          price has, instead of two independently absolute-positioned
          elements that can drift apart vertically. */}
      <div className="absolute inset-x-3 top-3 flex items-start justify-between sm:inset-x-5 sm:top-5 md:inset-x-6 md:top-6">
        <div className="rounded-xl bg-white/95 px-2.5 py-1.5 shadow-md backdrop-blur-sm sm:rounded-2xl sm:px-4 sm:py-2.5">
          <p className="text-[8px] font-medium tracking-wide text-slate-500 sm:text-[10px]">GUIDE PRICE</p>
          <p className="text-sm font-bold leading-tight text-emerald-700 sm:text-lg md:text-xl">{price}</p>
        </div>

        <Link
          href={href}
          aria-label="Save project"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition-colors hover:text-primary sm:h-10 sm:w-10"
        >
          <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Link>
      </div>

      {/* Mini map */}
      {mapImage && (
        <div className="absolute right-3 top-14 w-24 overflow-hidden rounded-xl bg-white/90 shadow-md backdrop-blur-sm sm:right-5 sm:top-20 sm:w-32 sm:rounded-2xl md:right-6 md:w-36">
          <div className="relative h-12 w-full sm:h-16 md:h-20">
            <Image src={mapImage} alt={`Map of ${areaName}`} fill sizes="144px" className="object-cover" />
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-600" />
          </div>
          <p className="truncate px-2 py-1 text-[7px] font-medium tracking-wide text-slate-500 sm:py-1.5 sm:text-[9px]">
            ON MAP · {areaName?.toUpperCase()}
          </p>
        </div>
      )}

      {/* Bottom content */}
      <div className="flex flex-col gap-3 p-3 sm:absolute sm:inset-x-0 sm:bottom-0 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:p-6 md:p-8">
        <div className="rounded-lg bg-slate-50 p-3 shadow-sm sm:max-w-sm sm:rounded sm:bg-white/35 sm:p-4 sm:shadow-md sm:backdrop-blur-sm md:max-w-md">
          <p className="text-[9px] font-medium tracking-wide text-slate-500 sm:text-[10px]">
            {location.toUpperCase()}
          </p>
          <p className="mt-1 text-base font-bold leading-snug text-slate-900 sm:text-lg md:text-xl">{title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-600 sm:gap-x-3 sm:text-xs">
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {beds} Beds
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {baths} Baths
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {areaSqft.toLocaleString()} sqft
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 py-1.5 pl-1.5 pr-3 shadow-sm sm:rounded sm:bg-white/35 sm:shadow-md sm:backdrop-blur-sm">
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full sm:h-9 sm:w-9">
              <Image src={agent.avatar} alt={agent.name} fill sizes="36px" className="object-cover" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-[9px] text-slate-500 sm:text-[10px]">Listing Agent</span>
              <span className="truncate text-[11px] font-semibold text-slate-900 sm:text-xs">{agent.name}</span>
            </span>
            <a
              href={`tel:${agent.phone}`}
              aria-label={`Call ${agent.name}`}
              className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white transition-colors hover:bg-emerald-800 sm:h-8 sm:w-8"
            >
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </a>
          </div>

          <Link
            href={href}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[11px] font-semibold text-slate-900 shadow-md transition-colors hover:bg-slate-50 sm:px-5 sm:py-3 sm:text-xs"
          >
            Book Now
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}