import { TestimonialCard } from './TestimonialCards';
import type { Testimonial } from '@/lib/types';
import { Reveal } from '@/components/Reveal';

interface RealStoriesProps {
  testimonials: Testimonial[];
  embedded?: boolean;
}

export function RealStories({ testimonials, embedded = false }: RealStoriesProps) {
  const content = (
    <div className="relative z-10 mx-auto max-w-6xl px-4">
      <Reveal>
        <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">Loved by Owners</span>
        <h2 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">Real stories. Real trust.</h2>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Reveal key={testimonial.id} delay={(index % 3) * 0.08}>
            <TestimonialCard testimonial={testimonial} />
          </Reveal>
        ))}
      </div>
    </div>
  );

  if (embedded) {
    return <div className="mt-16 sm:mt-20">{content}</div>;
  }

  return <section className="py-16 sm:py-20 bg-[#F3F5F966]">{content}</section>;
}