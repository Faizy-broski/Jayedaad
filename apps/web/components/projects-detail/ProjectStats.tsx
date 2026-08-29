'use client';

import { Building2, MapPin, CalendarClock, Layers, Wallet } from 'lucide-react';
import { useFormattedPrice } from '@jayedaad/core';
import { VerifiedBadgeIcon } from '@/components/icons/VerifiedBadgeIcon';
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

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface ProjectStatsProps {
  project: DisplayProject;
}

export function ProjectStats({ project }: ProjectStatsProps) {
  // Was a local, PKR-only formatPrice() — listing prices everywhere else
  // go through this currency-aware hook, project prices never got the same
  // treatment and silently ignored the user's preferredCurrency setting.
  const { format: formatPrice } = useFormattedPrice();
  const rows = [
    [
      { icon: Building2, label: 'Status', value: STATUS_LABEL[project.status] },
      { icon: MapPin, label: 'Location', value: `${project.area}, ${project.city}` },
      { icon: CalendarClock, label: 'Possession', value: formatDate(project.possessionDate) },
      { icon: Layers, label: 'Unit Types', value: `${project.unitTypes.length}` },
    ],
    [
      { icon: VerifiedBadgeIcon, label: 'Verification', value: VERIFICATION_LABEL[project.verificationStatus] },
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
            <div key={label} className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
