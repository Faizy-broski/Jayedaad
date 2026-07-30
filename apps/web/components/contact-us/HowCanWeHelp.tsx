import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Home, Building2, Briefcase, LifeBuoy } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

interface ContactOption {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Home;
  image?: string;
}

const CONTACT_OPTIONS: ContactOption[] = [
  {
    id: 'buy-invest',
    eyebrow: 'Sales',
    title: 'Looking to buy or invest?',
    description: 'Speak with a dedicated property consultant.',
    href: '/search',
    icon: Home,
    image: '/images/services-image.png',
  },
  {
    id: 'sell-rent',
    eyebrow: 'Property Owners',
    title: 'Want to sell or rent your property?',
    description: "List with Jayedaad's advisory team.",
    href: '/submit',
    icon: Building2,
  },
  {
    id: 'commercial',
    eyebrow: 'Commercial',
    title: 'Need offices or commercial spaces?',
    description: 'Talk to our business advisors.',
    href: '/search?type=commercial',
    icon: Briefcase,
  },
  {
    id: 'support',
    eyebrow: 'Customer Support',
    title: 'Already using Jayedaad?',
    description: "We're always here to help.",
    href: '/help',
    icon: LifeBuoy,
  },
];

export function HowCanWeHelp() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            02 — How Can We Help
          </span>
          <h2 className="mt-2 max-w-sm text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
            Four ways to begin the conversation.
          </h2>
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
          Every enquiry is handled personally by a specialist who understands the market you&apos;re moving in.
        </p>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CONTACT_OPTIONS.map(({ id, eyebrow, title, description, href, icon: Icon, image }, index) => (
          <Reveal key={id} delay={(index % 2) * 0.08}>
            {image ? (
              <Link
                href={href}
                className="group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl p-5"
              >
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

                <div className="relative z-10 flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors group-hover:bg-white/25">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <div className="relative z-10 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{eyebrow}</span>
                  <span className="text-lg font-semibold text-white">{title}</span>
                  <span className="text-xs text-white/70">{description}</span>
                </div>
              </Link>
            ) : (
              <Link
                href={href}
                className="group flex h-full min-h-[220px] flex-col justify-between rounded-2xl bg-[#F3F4F6] p-5 transition-colors hover:bg-[#F3F4F6]/50"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors group-hover:text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{eyebrow}</span>
                  <span className="text-lg font-semibold text-slate-900">{title}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </div>
              </Link>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
