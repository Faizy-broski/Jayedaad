// Every price display in the app used to be a hardcoded "PKR {price}"
// string literal — the preferredCurrency user preference was stored/saved
// correctly but never actually consumed anywhere. This is the one real
// consumer, driven by whatever currency code is passed in (falls back to
// PKR, this app's only real market today — no FX conversion exists, so this
// formats the raw amount as-is under whichever currency code is selected).
//
// PKR amounts use South Asian numbering (Lac/Crore/Arab) — property prices
// in Pakistan are always quoted this way (e.g. "PKR 6.85 Cr", "PKR 42 Lac"),
// never as a bare "PKR 68,500,000". Already a real, established convention
// in this codebase (apps/web's property-management page-range slider
// labels) — promoted here so every price display across web + mobile uses
// it consistently, not just that one slider. Amounts under 1 Lac (e.g.
// subscription plan fees, which are always this small) are unaffected and
// still render as a plain comma-formatted currency string. Non-PKR
// currencies fall back to Intl.NumberFormat — Lac/Crore is a PKR-specific
// convention, not a generic one.
export function formatPrice(amount: number, currencyCode = 'PKR'): string {
  if (currencyCode !== 'PKR') {
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

  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${sign}PKR ${trimZero(abs / 1_000_000_000)} Arab`;
  if (abs >= 10_000_000) return `${sign}PKR ${trimZero(abs / 10_000_000)} Cr`;
  if (abs >= 100_000) return `${sign}PKR ${trimZero(abs / 100_000)} Lac`;
  return `${sign}PKR ${abs.toLocaleString('en-PK')}`;
}

function trimZero(n: number): string {
  return n % 1 === 0 ? n.toString() : n.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
}
