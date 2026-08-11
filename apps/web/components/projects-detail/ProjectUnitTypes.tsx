import { Bed, Bath, Ruler } from 'lucide-react';
import type { ProjectUnitType } from '@/lib/types';

function formatPrice(value: number): string {
  if (value >= 10_000_000) return `PKR ${(value / 10_000_000).toFixed(1)} Cr`;
  if (value >= 100_000) return `PKR ${(value / 100_000).toFixed(1)} Lac`;
  return `PKR ${value.toLocaleString()}`;
}

interface ProjectUnitTypesProps {
  unitTypes: ProjectUnitType[];
}

export function ProjectUnitTypes({ unitTypes }: ProjectUnitTypesProps) {
  if (unitTypes.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
        No unit types available yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {unitTypes.map((unit) => (
        <div key={unit.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{unit.label}</p>
              <p className="text-xs text-slate-500">{unit.propertyType}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-primary">
              {unit.priceMax !== unit.priceMin
                ? `${formatPrice(unit.priceMin)} – ${formatPrice(unit.priceMax)}`
                : formatPrice(unit.priceMin)}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
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
