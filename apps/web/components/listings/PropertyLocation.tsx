import { PropertyMap } from './PropertyMap';
import type { ListingProperty } from '@/lib/types';

// Generic proximity estimates — a real backend would compute these from the
// listing's actual coordinates against a places API.
const NEARBY = [
  { label: 'Schools', time: '5 min' },
  { label: 'Hospitals', time: '8 min' },
  { label: 'Restaurants', time: '3 min' },
  { label: 'Mosques', time: '2 min' },
  { label: 'Parks', time: '6 min' },
  { label: 'Metro', time: '12 min' },
];

interface PropertyLocationProps {
  listing: ListingProperty;
}

export function PropertyLocation({ listing }: PropertyLocationProps) {
  return (
    <div>
      <PropertyMap properties={[listing]} />

      <div className="mt-4 grid grid-cols-3 gap-3">
        {NEARBY.map(({ label, time }) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
            <span className="block text-sm font-semibold text-slate-900">{time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
