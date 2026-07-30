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
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl sm:aspect-[16/9]">
      <Image src={image} alt={title} fill sizes="(min-width: 1024px) 1152px, 90vw" className="object-cover" />
      {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" /> */}

      {/* Guide price badge */}
      <div className="absolute left-5 top-5 rounded-2xl bg-white/95 px-4 py-2.5 shadow-md backdrop-blur-sm">
        <p className="text-[10px] font-medium tracking-wide text-slate-500">GUIDE PRICE</p>
        <p className="text-lg font-bold leading-tight text-emerald-700">{price}</p>
      </div>

      {/* Bookmark */}
      <Link
        href={href}
        aria-label="Save project"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition-colors hover:text-primary"
      >
        <Bookmark className="h-4 w-4" />
      </Link>

      {/* Mini map */}
      {mapImage && (
        <div className="absolute right-5 top-20 w-32 overflow-hidden rounded-2xl bg-white/90 shadow-md backdrop-blur-sm sm:w-36">
          <div className="relative h-16 w-full sm:h-20">
            <Image src={mapImage} alt={`Map of ${areaName}`} fill className="object-cover" />
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-600" />
          </div>
          <p className="px-2 py-1.5 text-[9px] font-medium tracking-wide text-slate-500">
            ON MAP · {areaName?.toUpperCase()}
          </p>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="max-w-sm rounded bg-white/35 p-4 shadow-md backdrop-blur-sm">
          <p className="text-[10px] font-medium tracking-wide text-slate-500">
            {location.toUpperCase()}
          </p>
          <p className="mt-1 text-lg font-bold leading-snug text-slate-900">{title}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded bg-white/35 py-1.5 pl-1.5 pr-3 shadow-md backdrop-blur-sm">
            <span className="relative h-9 w-9 overflow-hidden rounded-full">
              <Image src={agent.avatar} alt={agent.name} fill sizes="36px" className="object-cover" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] text-slate-500">Listing Agent</span>
              <span className="text-xs font-semibold text-slate-900">{agent.name}</span>
            </span>
            <a
              href={`tel:${agent.phone}`}
              aria-label={`Call ${agent.name}`}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-white transition-colors hover:bg-emerald-800"
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