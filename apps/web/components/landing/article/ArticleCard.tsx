import Image from 'next/image';
import Link from 'next/link';

export function ArticleCard({ article }: { article: import('@/lib/types').Article }) {
  const { category, title, readTime, image, href } = article;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 1024px) 33vw, 90vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-2 p-5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{category}</span>
        <h3 className="text-base font-semibold leading-snug text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400">{readTime}</span>
      </div>
    </Link>
  );
}