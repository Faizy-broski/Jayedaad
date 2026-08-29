'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clapperboard, Flame, MapPin, Layers, Sparkles, ArrowRight } from 'lucide-react';
import { projectsRepository, useFormattedPrice } from '@jayedaad/core';
import type { ProjectCardData } from '@/lib/types';
import { getViewerSessionId } from '@/lib/viewerSession';
import { VerifiedBadgeIcon } from '@/components/icons/VerifiedBadgeIcon';

const STATUS_LABEL: Record<ProjectCardData['status'], string> = {
  planned: 'Planned',
  under_construction: 'Under Construction',
  ready: 'Ready',
  draft: 'Draft',
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  // Was a local, PKR-only formatPrice() — listing prices everywhere else
  // go through this currency-aware hook (see PropertyCard.tsx), project
  // prices never got the same treatment and silently ignored the user's
  // preferredCurrency setting.
  const { format: formatPrice } = useFormattedPrice();
  // Same boost/story badge treatment as listings' own PropertyCard.tsx —
  // a buyer should recognize "this is boosted" identically whether it's a
  // listing or a project.
  const isBoosted = project.boostTier === 'hot' || project.boostTier === 'super_hot';
  const hasActiveStory = !!project.storyExpiresAt && new Date(project.storyExpiresAt) > new Date();
  return (
    <Link
      href={`/developments/${project.slug}`}
      onClick={() =>
        projectsRepository
          .trackEngagement(project.id, { type: 'click', platform: 'web', viewerSessionId: getViewerSessionId() })
          .catch(() => {})
      }
      className="block w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image src={project.coverImageUrl} alt={project.name} fill sizes="288px" className="object-cover" />
        {project.verificationStatus === 'verified' && (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
            <VerifiedBadgeIcon className="h-3 w-3 text-primary" />
            Verified
          </span>
        )}
        {(isBoosted || hasActiveStory) && (
          <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1.5">
            {isBoosted && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                {project.boostTier === 'super_hot' ? <Flame className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                {project.boostTier === 'super_hot' ? 'Super Hot' : 'Hot'}
              </span>
            )}
            {hasActiveStory && (
              <span className="flex items-center gap-1 rounded-full bg-fuchsia-100 px-2.5 py-1 text-[10px] font-semibold text-fuchsia-700">
                <Clapperboard className="h-3 w-3" />
                Story
              </span>
            )}
          </div>
        )}
        <div className="absolute left-2.5 bottom-2.5 flex gap-1.5">
          <span className="rounded-full bg-heading-gradient px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
            {STATUS_LABEL[project.status]}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold text-foreground">{project.name}</h3>
        </div>

        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {project.area}, {project.city}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {project.unitTypeCount} unit type{project.unitTypeCount === 1 ? '' : 's'}
          </span>
           <span className="text-sm font-semibold text-primary">{formatPrice(project.priceRangeMin)}+</span>
        </div>

        <div className="flex gap-3 border-t border-border pt-3 text-xs">
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
