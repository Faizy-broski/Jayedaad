// Every price display in the app used to be a hardcoded "PKR {price}"
// string literal — the preferredCurrency user preference was stored/saved
// correctly but never actually consumed anywhere. This is the one real
// consumer: Intl.NumberFormat-based, driven by whatever currency code is
// passed in (falls back to PKR, this app's only real market today — no FX
// conversion exists, so this formats the raw amount as-is under whichever
// currency code is selected, it doesn't convert between currencies).
export function formatPrice(amount: number, currencyCode = 'PKR'): string {
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString('en-PK')}`;
  }
}
