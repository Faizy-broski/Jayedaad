import { formatPrice } from '@jayedaad/core';

// Preset PKR price bands from 0 up to 100 Crore (1 Arab) — used by the
// Min/Max price selects on the listings filter sidebar and the /search bar,
// so users pick a round PKR amount (formatted Lac/Crore/Arab via
// formatPrice) instead of typing a raw number.
export const PRICE_OPTIONS: number[] = [
  2_500_000,
  5_000_000,
  7_500_000,
  10_000_000,
  15_000_000,
  20_000_000,
  30_000_000,
  40_000_000,
  50_000_000,
  75_000_000,
  100_000_000,
  150_000_000,
  200_000_000,
  300_000_000,
  500_000_000,
  1_000_000_000,
];

export function priceOptionLabel(value: number): string {
  return formatPrice(value).replace('PKR ', '');
}
