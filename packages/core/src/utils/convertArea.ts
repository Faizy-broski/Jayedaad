import { AreaUnit } from '../models';

// Standard Pakistani real-estate conversion factors, expressed as "1 unit
// = N square feet" (sq ft as the common base unit every other unit
// converts through). 1 Marla = 225 sq ft, 1 Kanal = 20 Marla = 4500 sq ft,
// 1 Acre = 43,560 sq ft, 1 sq yd = 9 sq ft, 1 sq m = 10.7639 sq ft.
export const AREA_TO_SQFT: Record<AreaUnit, number> = {
  sqft: 1,
  sqyd: 9,
  sqm: 10.7639,
  marla: 225,
  kanal: 4500,
  acre: 43560,
};

// Pure conversion, via sq ft as the common base — previously there was no
// conversion utility of any kind anywhere in the codebase; every area
// value was only ever displayed in whatever unit it was originally
// entered in, regardless of a viewer's preferredAreaUnit.
export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  if (from === to) return value;
  return (value * AREA_TO_SQFT[from]) / AREA_TO_SQFT[to];
}
