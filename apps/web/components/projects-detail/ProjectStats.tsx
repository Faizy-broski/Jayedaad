import { Building2, MapPin, CalendarClock, Layers, BadgeCheck, Wallet } from 'lucide-react';
import type { DisplayProject } from '@/lib/types';

const STATUS_LABEL: Record<DisplayProject['status'], string> = {
  planned: 'Planned',
  under_construction: 'Under Construction',
  ready: 'Ready',
  draft: 'Draft',
};

const VERIFICATION_LABEL: Record<DisplayProject['verificationStatus'], string> = {
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
  draft: 'Draft',
};

function formatPrice(value: number): string {
  if (value >= 10_000_000) return `PKR ${(value / 10_000_000).toFixed(1)} Cr`;
  if (value >= 100_000) return `PKR ${(value / 100_000).toFixed(1)} Lac`;
  return `PKR ${value.toLocaleString()}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface ProjectStatsProps {
  project: DisplayProject;
}

export function ProjectStats({ project }: ProjectStatsProps) {
  const rows = [
    [
      { icon: Building2, label: 'Status', value: STATUS_LABEL[project.status] },
      { icon: MapPin, label: 'Location', value: `${project.area}, ${project.city}` },
      { icon: CalendarClock, label: 'Possession', value: formatDate(project.possessionDate) },
      { icon: Layers, label: 'Unit Types', value: `${project.unitTypes.length}` },
    ],
    [
      { icon: BadgeCheck, label: 'Verification', value: VERIFICATION_LABEL[project.verificationStatus] },
      {
        icon: Wallet,
        label: 'Price Range',
        value:
          project.priceRange.max !== project.priceRange.min
            ? `${formatPrice(project.priceRange.min)} – ${formatPrice(project.priceRange.max)}`
            : formatPrice(project.priceRange.min),
      },
    ],
  ];

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {row.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-4">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
              <span className="text-sm font-semibold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
