import { Bed, Bath, Ruler, Car, Building2, Calendar, Tag, KeyRound, Wallet } from 'lucide-react';
import { useFormattedArea, useFormattedPrice } from '@jayedaad/core';
import type { ListingProperty } from '@/lib/types';

interface PropertyStatsProps {
  listing: ListingProperty;
}

export function PropertyStats({ listing }: PropertyStatsProps) {
  const { format: formatPrice } = useFormattedPrice();
  const { format: formatArea } = useFormattedArea();

  // Real, computed directly from this listing — previously lived in the
  // since-removed "Investment analysis" section alongside three fake
  // market-estimate stats (Rental Yield/ROI/Area Growth); relocated here
  // next to the rest of the page's real per-listing facts. Computed in
  // raw PKR-per-canonical-sqft first (a fixed, unit-independent ratio),
  // currency-converted for display only — "price per sq ft" wouldn't mean
  // anything if the numerator and denominator used different unit
  // conversions independently.
  const pricePerSqftPKR = Math.round(listing.priceValue / listing.areaSqft);

  const rows = [
    [
      { icon: Bed, label: 'Beds', value: listing.beds },
      { icon: Bath, label: 'Baths', value: listing.baths },
      { icon: Ruler, label: 'Area', value: formatArea(listing.areaSqft, 'sqft') },
      { icon: Car, label: 'Parking', value: `${listing.parkingSpots} cars` },
    ],
    [
      { icon: Building2, label: 'Type', value: listing.propertyType },
      { icon: Calendar, label: 'Year Built', value: listing.yearBuilt },
      { icon: Tag, label: 'Purpose', value: listing.listingType === 'sale' ? 'For Sale' : 'For Rent' },
      { icon: KeyRound, label: 'Ownership', value: listing.ownership },
    ],
    [{ icon: Wallet, label: 'Price / Sq Ft', value: `${formatPrice(pricePerSqftPKR)} / sqft` }],
  ];

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {row.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
