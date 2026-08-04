import { Waves, Car, Trees, Dumbbell, ShieldCheck, ArrowUpDown, Sparkles, type LucideIcon } from 'lucide-react';

const AMENITY_ICONS: Record<string, LucideIcon> = {
  'Swimming Pool': Waves,
  Parking: Car,
  Garden: Trees,
  Gym: Dumbbell,
  Security: ShieldCheck,
  Elevator: ArrowUpDown,
};

interface ProjectAmenitiesProps {
  amenities: string[];
}

export function ProjectAmenities({ amenities }: ProjectAmenitiesProps) {
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
