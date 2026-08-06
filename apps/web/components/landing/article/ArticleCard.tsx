import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@jayedaad/core';
import { Newspaper } from 'lucide-react';

export function ArticleCard({ post }: { post: BlogPost }) {
  const { category, title, readTime, coverImageUrl, slug } = post;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, 90vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Newspaper className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-5">
        {category && <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{category.name}</span>}
        <h3 className="text-base font-semibold leading-snug text-slate-900">{title}</h3>
        {readTime && <span className="text-xs text-slate-400">{readTime}</span>}
      </div>
    </Link>
  );
}
