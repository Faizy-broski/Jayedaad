// Pure conversion — every stored listing price is PKR; this turns that raw
// amount into the equivalent in another currency using a real fetched rate
// (see useExchangeRatesViewModel/services/api's exchange-rates module),
// unlike formatPrice() alone, which only ever re-labels the same number.
// Returns the amount unchanged for PKR itself or when no rate is available
// yet (rates still loading) — callers should treat "unchanged because no
// rate" the same as "PKR", never as "this IS the converted amount."
export function convertPrice(amountPKR: number, currencyCode: string, rates: Record<string, number>): number {
  if (currencyCode === 'PKR') return amountPKR;
  const rate = rates[currencyCode];
  if (!rate) return amountPKR;
  return amountPKR * rate;
}
