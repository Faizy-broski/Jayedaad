import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Service } from '@/lib/types';

export function ServiceCard({ service }: { service: Service }) {
  const { title, description, href, icon: Icon, image } = service;

  if (image) {
    // Featured, image-backed variant (currently just "Buy Property").
    return (
      <Link
        href={href}
        className="group relative flex h-full min-h-[300px] lg:min-h-[400px] flex-col justify-end overflow-hidden rounded-3xl p-5 transition-shadow duration-300 ease-out hover:shadow-xl hover:shadow-black/20"
      >
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 1024px) 33vw, 90vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 group-hover:from-black/95 group-hover:via-black/70" />

        <span className="flex h-9 w-9 items-center my-3 justify-center rounded-full bg-white text-muted-foreground backdrop-blur-sm transition-all duration-300 ease-out group-hover:bg-primary group-hover:text-white group-hover:scale-110">
          <Icon className="h-4 w-4" />
        </span>

        <div className="relative z-10 flex flex-col gap-1 transition-transform duration-300 ease-out group-hover:-translate-y-1">
          <span className="text-base font-semibold text-white">{title}</span>
          <span className="text-xs text-white/70">{description}</span>
          <span className="mt-2 flex items-center gap-1 text-xs font-medium text-white">
            Learn more
            <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 ease-out group-hover:bg-primary group-hover:text-white group-hover:scale-110">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">{title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      </div>
      <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary">
        Learn more
        <ArrowRight className="h-3 w-3 transition-transform duration-300 ease-out group-hover:translate-x-1" />
      </span>
    </Link>
  );
}