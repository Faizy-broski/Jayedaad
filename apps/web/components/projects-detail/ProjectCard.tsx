import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin, Layers, ArrowRight } from 'lucide-react';
import type { DisplayProject } from '@/lib/types';

const STATUS_LABEL: Record<DisplayProject['status'], string> = {
  planned: 'Planned',
  under_construction: 'Under Construction',
  ready: 'Ready',
  draft: 'Draft',
};

function formatPrice(value: number): string {
  if (value >= 10_000_000) return `PKR ${(value / 10_000_000).toFixed(1)} Cr`;
  if (value >= 100_000) return `PKR ${(value / 100_000).toFixed(1)} Lac`;
  return `PKR ${value.toLocaleString()}`;
}

export function ProjectCard({ project }: { project: DisplayProject }) {
  return (
    <article className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
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
          <h3 className="text-sm font-semibold text-slate-900">{project.name}</h3>
        </div>

        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {project.area}, {project.city}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {project.unitTypes.length} unit type{project.unitTypes.length === 1 ? '' : 's'}
          </span>
          <span className="text-sm font-semibold text-primary">{formatPrice(project.priceRange.min)}+</span>
        </div>

        <div className="flex gap-3 border-t border-slate-200 pt-3 text-xs">
          <Link
            href={`/developments/${project.slug}`}
            className="mr-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View Details
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
