import type { ListingProperty } from '@/lib/types';

interface InvestmentAnalysisProps {
  listing: ListingProperty;
}

// Rental yield / ROI / area growth are market-level estimates (a real
// backend would derive these from comparable transaction data) — only
// price/sqft is computed directly from this listing.
export function InvestmentAnalysis({ listing }: InvestmentAnalysisProps) {
  const pricePerSqft = Math.round(listing.priceValue / listing.areaSqft);

  const stats = [
    { label: 'Rental Yield', value: '6.4%' },
    { label: 'ROI (3 Yr)', value: '22%' },
    { label: 'Area Growth', value: '+14% YoY' },
    { label: 'Price / Sq Ft', value: `PKR ${pricePerSqft.toLocaleString('en-PK')}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
          <span className="mt-1 block text-lg font-bold text-heading-gradient">{value}</span>
        </div>
      ))}
    </div>
  );
}
