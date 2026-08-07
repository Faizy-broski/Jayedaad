import { Waves, Car, Trees, Dumbbell, ShieldCheck, ArrowUpDown, Sparkles, type LucideIcon } from 'lucide-react';

// Real amenities.label values (Super Admin-managed, supabase/migrations/
// 0005_taxonomy_seed.sql onward) are not a fixed enum — only a few have a
// dedicated icon here, everything else falls back to Sparkles rather than
// crashing on an unrecognized label. Same fallback discipline as the
// projects detail page's ProjectAmenities.
const AMENITY_ICONS: Record<string, LucideIcon> = {
  'Swimming Pool': Waves,
  Parking: Car,
  Garden: Trees,
  Gym: Dumbbell,
  Security: ShieldCheck,
  Elevator: ArrowUpDown,
};

interface PropertyAmenitiesProps {
  amenities: string[];
}

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {amenities.map((amenity) => {
        const Icon = AMENITY_ICONS[amenity] ?? Sparkles;
        return (
          <div
            key={amenity}
            className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            {amenity}
          </div>
        );
      })}
    </div>
  );
}
