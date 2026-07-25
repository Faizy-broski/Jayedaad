import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Category } from '@/lib/types';

export function CategoryCard({ category }: { category: Category }) {
  const { label, listingsCount, image, href } = category;

  return (
    <Link
      href={href}
      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-3xl"
    >
      <Image
        src={image}
        alt={label}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* Bottom-anchored scrim — gradient rather than a flat overlay so the
          image stays visible up top and only darkens enough near the text
          for it to stay legible over any photo. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 transition-colors group-hover:bg-white group-hover:text-primary">
        <ArrowUpRight className="h-4 w-4" />
      </span>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4">
        <span className="text-base font-semibold text-white">{label}</span>
        <span className="text-xs text-white/75">{listingsCount.toLocaleString()} listings</span>
      </div>
    </Link>
  );
}