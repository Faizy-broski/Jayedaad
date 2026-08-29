'use client';

import { Bed, Bath, Ruler } from 'lucide-react';
import { useFormattedPrice } from '@jayedaad/core';
import type { ProjectUnitType } from '@/lib/types';

interface ProjectUnitTypesProps {
  unitTypes: ProjectUnitType[];
}

export function ProjectUnitTypes({ unitTypes }: ProjectUnitTypesProps) {
  // Was a local, PKR-only formatPrice() — listing prices everywhere else
  // go through this currency-aware hook, project prices never got the same
  // treatment and silently ignored the user's preferredCurrency setting.
  const { format: formatPrice } = useFormattedPrice();

  if (unitTypes.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No unit types available yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {unitTypes.map((unit) => (
        <div key={unit.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{unit.label}</p>
              <p className="text-xs text-muted-foreground">{unit.propertyType}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-primary">
              {unit.priceMax !== unit.priceMin
                ? `${formatPrice(unit.priceMin)} – ${formatPrice(unit.priceMax)}`
                : formatPrice(unit.priceMin)}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5" />
              {unit.bedrooms} Bed
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="h-3.5 w-3.5" />
              {unit.bathrooms} Bath
            </span>
            <span className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5" />
              {unit.areaValueMax !== unit.areaValueMin
                ? `${unit.areaValueMin.toLocaleString()} – ${unit.areaValueMax.toLocaleString()}`
                : unit.areaValueMin.toLocaleString()}{' '}
              {unit.areaUnit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
