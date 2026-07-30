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
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm sm:aspect-[16/9] sm:shadow-none">
      <div className="relative aspect-[4/3] w-full sm:absolute sm:inset-0 sm:aspect-auto">
        <Image src={image} alt={title} fill sizes="(min-width: 1024px) 1152px, 100vw" className="object-cover" />
      </div>

      {/* Guide price badge */}
      <div className="absolute left-3 top-3 rounded-2xl bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm sm:left-5 sm:top-5 sm:px-4 sm:py-2.5">
        <p className="text-[9px] font-medium tracking-wide text-slate-500 sm:text-[10px]">GUIDE PRICE</p>
        <p className="text-base font-bold leading-tight text-emerald-700 sm:text-lg">{price}</p>
      </div>

      {/* Bookmark */}
      <Link
        href={href}
        aria-label="Save project"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition-colors hover:text-primary sm:right-5 sm:top-5 sm:h-10 sm:w-10"
      >
        <Bookmark className="h-4 w-4" />
      </Link>

      {/* Mini map */}
      {mapImage && (
        <div className="absolute right-3 top-16 w-28 overflow-hidden rounded-2xl bg-white/90 shadow-md backdrop-blur-sm sm:right-5 sm:top-20 sm:w-36">
          <div className="relative h-14 w-full sm:h-20">
            <Image src={mapImage} alt={`Map of ${areaName}`} fill className="object-cover" />
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-600" />
          </div>
          <p className="px-2 py-1.5 text-[8px] font-medium tracking-wide text-slate-500 sm:text-[9px]">
            ON MAP · {areaName?.toUpperCase()}
          </p>
        </div>
      )}

      {/* Bottom content */}
      <div className="flex flex-col gap-4 p-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="rounded bg-slate-50 p-4 shadow-sm sm:max-w-sm sm:bg-white/35 sm:shadow-md sm:backdrop-blur-sm">
          <p className="text-[10px] font-medium tracking-wide text-slate-500">
            {location.toUpperCase()}
          </p>
          <p className="mt-1 text-lg font-bold leading-snug text-slate-900">{title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded bg-slate-50 py-1.5 pl-1.5 pr-3 shadow-sm sm:bg-white/35 sm:shadow-md sm:backdrop-blur-sm">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
              <Image src={agent.avatar} alt={agent.name} fill sizes="36px" className="object-cover" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-[10px] text-slate-500">Listing Agent</span>
              <span className="truncate text-xs font-semibold text-slate-900">{agent.name}</span>
            </span>
            <a
              href={`tel:${agent.phone}`}
              aria-label={`Call ${agent.name}`}
              className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white transition-colors hover:bg-emerald-800"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          </div>

          <Link
            href={href}
            className="flex items-center gap-1.5 rounded-full bg-white px-5 py-3 text-xs font-semibold text-slate-900 shadow-md transition-colors hover:bg-slate-50"
          >
            Book Now
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}