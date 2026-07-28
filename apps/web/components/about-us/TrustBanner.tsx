import Image from 'next/image';
import { ShieldCheck, Users, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const FEATURES = [
  {
    id: 'verified-listings',
    icon: ShieldCheck,
    title: 'Verified Listings',
    description: 'Every property inspected and confirmed before it ever appears on-site.',
  },
  {
    id: 'trusted-agents',
    icon: Users,
    title: 'Trusted Agents',
    description: 'Backed by licensing checks and real transaction history.',
  },
  {
    id: 'ai-matching',
    icon: Sparkles,
    title: 'AI-Powered Matching',
    description: 'Software that learns what a home actually needs to be, for you.',
  },
];

export function TrustBanner() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <Image
        src="/images/about-us/trusted.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <Reveal className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            — How We&apos;re Trusted —
          </span>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            Trust isn&apos;t promised. It&apos;s verified.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map(({ id, icon: Icon, title, description }, index) => (
            <Reveal
              key={id}
              delay={index * 0.08}
              className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-white">{title}</span>
              <p className="text-xs leading-relaxed text-white/60">{description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
