import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { City } from '@/lib/types';

export function CityCard({ city }: { city: City }) {
  const { name, homesCount, image, href } = city;

  return (
    <Link
      href={href}
      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl"
    >
      <Image
        src={image}
        alt={name}
        fill
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* Bottom scrim only — the image's own natural darkness (dusk skies,
          night shots) carries the top of the card, so unlike CategoryCard
          this doesn't need a from-black/70 pushed all the way up. */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-white/25">
        <ArrowUpRight className="h-4 w-4" />
      </span>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4">
        <span className="text-lg font-semibold text-white">{name}</span>
        <span className="text-xs text-white/70">{homesCount.toLocaleString()} homes</span>
      </div>
    </Link>
  );
}