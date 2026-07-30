import { Waves, Car, Trees, Dumbbell, ShieldCheck, ArrowUpDown, type LucideIcon } from 'lucide-react';
import type { AmenityOption } from '@/lib/types';

const AMENITY_ICONS: Record<AmenityOption, LucideIcon> = {
  'Swimming Pool': Waves,
  Parking: Car,
  Garden: Trees,
  Gym: Dumbbell,
  Security: ShieldCheck,
  Elevator: ArrowUpDown,
};

interface PropertyAmenitiesProps {
  amenities: AmenityOption[];
}

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {amenities.map((amenity) => {
        const Icon = AMENITY_ICONS[amenity];
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
