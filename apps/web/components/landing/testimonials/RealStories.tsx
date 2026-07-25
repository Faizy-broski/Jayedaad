import { TestimonialCard } from './TestimonialCards';
import type { Testimonial } from '@/lib/types';

interface RealStoriesProps {
  testimonials: Testimonial[];
}

export function RealStories({ testimonials }: RealStoriesProps) {
  return (
    <section className="py-16 sm:py-20 bg-[#F3F5F966]">
      <div className="mx-auto max-w-6xl px-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-highlight">Loved by Owners</span>
        <h2 className="mt-2 text-3xl font-bold text-brand-dark sm:text-4xl">Real stories. Real trust.</h2>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}