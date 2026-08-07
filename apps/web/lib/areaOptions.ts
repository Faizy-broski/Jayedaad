import type { AreaUnit } from '@jayedaad/core';

// Preset area bands per unit — Marla/Kanal (Pakistan's real plot-size
// convention) get their own natural scale rather than one generic list
// reused across every unit, same spirit as lib/priceOptions.ts's PKR bands.
export const AREA_UNIT_OPTIONS: Record<AreaUnit, number[]> = {
  marla: [2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100],
  kanal: [1, 2, 3, 4, 5, 8, 10, 15, 20, 25, 30, 50],
  sqft: [500, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000],
  sqyd: [100, 200, 300, 500, 1000, 2000, 5000],
  sqm: [50, 100, 200, 300, 500, 1000, 2000],
  acre: [1, 2, 5, 10, 20, 50, 100],
};

export const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];

export function areaUnitLabel(unit: AreaUnit): string {
  return unit === 'sqft' ? 'Sq. Ft' : unit === 'sqyd' ? 'Sq. Yd' : unit === 'sqm' ? 'Sq. M' : unit.charAt(0).toUpperCase() + unit.slice(1);
}
