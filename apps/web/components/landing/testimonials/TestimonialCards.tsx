import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Testimonial } from '@/lib/types';

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { quote, name, role, avatar, rating } = testimonial;

  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-0.5 text-highlight">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className="h-4 w-4"
            fill={index < rating ? 'currentColor' : 'none'}
            strokeWidth={index < rating ? 0 : 1.5}
          />
        ))}
      </div>

      <p className="text-sm leading-relaxed text-foreground">&ldquo;{quote}&rdquo;</p>

      <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
          <Image src={avatar} alt={name} fill sizes="36px" className="object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">{role}</span>
        </div>
      </div>
    </div>
  );
}