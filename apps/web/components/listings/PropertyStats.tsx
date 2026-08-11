import { Bed, Bath, Ruler, Car, Building2, Calendar, Tag, KeyRound, Wallet } from 'lucide-react';
import type { ListingProperty } from '@/lib/types';

interface PropertyStatsProps {
  listing: ListingProperty;
}

export function PropertyStats({ listing }: PropertyStatsProps) {
  // Real, computed directly from this listing — previously lived in the
  // since-removed "Investment analysis" section alongside three fake
  // market-estimate stats (Rental Yield/ROI/Area Growth); relocated here
  // next to the rest of the page's real per-listing facts.
  const pricePerSqft = Math.round(listing.priceValue / listing.areaSqft);

  const rows = [
    [
      { icon: Bed, label: 'Beds', value: listing.beds },
      { icon: Bath, label: 'Baths', value: listing.baths },
      { icon: Ruler, label: 'Area', value: `${listing.areaSqft.toLocaleString()} sqft` },
      { icon: Car, label: 'Parking', value: `${listing.parkingSpots} cars` },
    ],
    [
      { icon: Building2, label: 'Type', value: listing.propertyType },
      { icon: Calendar, label: 'Year Built', value: listing.yearBuilt },
      { icon: Tag, label: 'Purpose', value: listing.listingType === 'sale' ? 'For Sale' : 'For Rent' },
      { icon: KeyRound, label: 'Ownership', value: listing.ownership },
    ],
    [{ icon: Wallet, label: 'Price / Sq Ft', value: `PKR ${pricePerSqft.toLocaleString('en-PK')}` }],
  ];

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {row.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-4">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
              <span className="text-sm font-semibold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
