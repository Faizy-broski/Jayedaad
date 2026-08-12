"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Bed,
  Bath,
  Ruler,
  Heart,
  ArrowRight,
  MapPin,
  Eye,
  Flame,
  Sparkles,
  Clapperboard,
} from "lucide-react";
import type { Property } from "@/lib/types";
import { useFavorites } from "@/lib/favoritesContext";

export function PropertyCard({ property }: { property: Property }) {
  const {
    id,
    title,
    location,
    price,
    image,
    listingType,
    verified,
    beds,
     viewCount,
    baths,
    areaSqft,
    boostTier,
    storyExpiresAt,
  } = property;
  const { isFavorited, toggle } = useFavorites();
  const favorited = isFavorited(id);
  const isBoosted = boostTier === "hot" || boostTier === "super_hot";
  const hasActiveStory = !!storyExpiresAt && new Date(storyExpiresAt) > new Date();

  return (
    <Link
      href={`/listings/${id}`}
      className="block w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="288px"
          className="object-cover"
        />
        <div>
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
            {verified && (
              <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                <BadgeCheck className="h-3 w-3 text-primary" />
                Verified
              </span>
            )}
            {isBoosted && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                {boostTier === "super_hot" ? <Flame className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                {boostTier === "super_hot" ? "Super Hot" : "Hot"}
              </span>
            )}
            {hasActiveStory && (
              <span className="flex items-center gap-1 rounded-full bg-fuchsia-100 px-2.5 py-1 text-[10px] font-semibold text-fuchsia-700">
                <Clapperboard className="h-3 w-3" />
                Story
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label={favorited ? "Remove from favorites" : "Save listing"}
            aria-pressed={favorited}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(id);
            }}
            className={`absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 transition-colors ${
              favorited ? "text-primary" : "text-slate-500 hover:text-primary"
            }`}
          >
            <Heart className="h-3.5 w-3.5" fill={favorited ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="absolute left-2.5 bottom-2.5 flex gap-1.5">
          <span className="rounded-full bg-heading-gradient px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
            {listingType === "sale" ? "For Sale" : "For Rent"}
          </span>
           {typeof viewCount === "number" && (
            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
              <Eye className="h-3 w-3 text-primary" />
              {viewCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900">{title}</h3>
          <span className="shrink-0 text-sm font-semibold text-primary">
            {price}
          </span>
        </div>

        <p className="flex items-center gap-1 truncate text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {location}
        </p>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            {beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {baths}
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {areaSqft.toLocaleString()} sqft
          </span>
        </div>

        <div className="flex gap-3 border-t border-slate-200 pt-3 text-xs">
          {/* Not its own <Link> — the whole card is already one (see the
              outer element), and nested <a> tags are invalid HTML/React.
              Kept as visible affordance text only. */}
          <span className="mr-auto flex items-center gap-1 text-xs font-medium text-primary">
            View Details
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
