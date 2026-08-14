'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin, Layers, ArrowRight } from 'lucide-react';
import { projectsRepository, useFormattedPrice } from '@jayedaad/core';
import type { ProjectCardData } from '@/lib/types';
import { getViewerSessionId } from '@/lib/viewerSession';

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
  return (
    <Link
      href={`/developments/${project.slug}`}
      onClick={() =>
        projectsRepository
          .trackEngagement(project.id, { type: 'click', platform: 'web', viewerSessionId: getViewerSessionId() })
          .catch(() => {})
      }
      className="block w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image src={project.coverImageUrl} alt={project.name} fill sizes="288px" className="object-cover" />
        {project.verificationStatus === 'verified' && (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
            <BadgeCheck className="h-3 w-3 text-primary" />
            Verified
          </span>
        )}
        <div className="absolute left-2.5 bottom-2.5 flex gap-1.5">
          <span className="rounded-full bg-heading-gradient px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
            {STATUS_LABEL[project.status]}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900">{project.name}</h3>
        </div>

        <p className="flex items-center gap-1 truncate text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {project.area}, {project.city}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {project.unitTypeCount} unit type{project.unitTypeCount === 1 ? '' : 's'}
          </span>
           <span className="text-sm font-semibold text-primary">{formatPrice(project.priceRangeMin)}+</span>
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
