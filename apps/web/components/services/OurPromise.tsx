import Image from 'next/image';
import type { ReactNode } from 'react';
import { Reveal } from '@/components/Reveal';

function CardEyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`relative z-10 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest ${className}`}
    >
      <span className="h-px w-3 bg-current" />
      {children}
    </span>
  );
}

export function OurPromise() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="pointer-events-none absolute right-0 hidden h-[420px] w-[280px] lg:block lg:h-[620px] lg:w-[420px]">
        <Image src="/images/logo-right.png" alt="" fill sizes="420px" className="object-contain" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            04 — Our Process
          </span>
          <h2 className="mt-2 max-w-md text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
            A studio approach to real estate.
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <Reveal className="relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl p-5 shadow-sm sm:col-span-2 sm:min-h-[300px] lg:col-span-5 lg:min-h-[479px]">
            <Image
              src="/images/services/architectural-detail.png"
              alt=""
              fill
              sizes="(min-width: 640px) 33vw, 90vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
            <CardEyebrow className="text-white/70 text-xl">01</CardEyebrow>
            <span className="relative z-10 mt-2 text-4xl font-semibold text-white">Trusted Agents</span>
            <p className="relative z-10 mt-1 text-sm leading-relaxed text-white/70 max-w-xs">
              Advisors selected for judgement, not volume. Long relationships, real conviction.
            </p>
          </Reveal>

          <Reveal
            delay={0.06}
            className="flex min-h-[220px] flex-col justify-between rounded-2xl bg-[#F2F2F2] p-5 shadow-sm ring-1 ring-black/5 lg:col-span-4"
          >
            <CardEyebrow className="text-slate-400">02 — Verified Properties</CardEyebrow>
            <div>
              <span className="text-5xl font-plus-jakarta-sans text-[#151B24] sm:text-6xl">100%</span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Every listing on Jayedaad passes a documented verification protocol before publication.
              </p>
            </div>
          </Reveal>

          <Reveal
            delay={0.12}
            className="flex min-h-[220px] flex-col justify-between rounded-2xl bg-transparent p-5 shadow-sm ring-1 ring-black/5 lg:col-span-3"
          >
            <div className="flex items-start justify-between">
              <CardEyebrow className="text-slate-400">03</CardEyebrow>
              <Image src="/svg/balance.svg" alt="" width={24} height={24} className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-semibold text-slate-900">Legal Compliance</span>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Contracts and titles handled by our in-house counsel.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <Reveal className="relative flex min-h-[160px] flex-col justify-between gap-6 rounded-2xl bg-[#212730] p-6 shadow-sm sm:col-span-2 sm:min-h-[200px] sm:p-8 lg:col-span-6">
            <CardEyebrow className="text-white/50">04 — AI Market Insights</CardEyebrow>
            <div className="flex items-center justify-between gap-6">
              <span className="max-w-xs text-2xl font-semibold leading-snug text-white sm:text-[28px]">
                Live intelligence on 47 Pakistani submarkets.
              </span>
              <Image src="/svg/graph.svg" alt="" width={24} height={24} className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" />
            </div>
          </Reveal>

          <Reveal
            delay={0.06}
            className="flex min-h-[160px] flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-3"
          >
            <div className="flex flex-col gap-3">
              <Image src="/svg/wallet.svg" alt="" width={24} height={24} className="h-6 w-6" />
              <CardEyebrow className="text-slate-400">05</CardEyebrow>
            </div>
            <span className="text-sm font-semibold text-slate-900">Mortgage Guidance</span>
          </Reveal>

          <Reveal
            delay={0.12}
            className="flex min-h-[160px] flex-col justify-between rounded-2xl bg-heading-gradient p-5 shadow-sm lg:col-span-3"
          >
            <div className="flex flex-col gap-3">
              <Image src="/svg/house.svg" alt="" width={24} height={24} className="h-6 w-6" />
              <CardEyebrow className="text-primary-foreground/70">06 — Portfolio</CardEyebrow>
            </div>
            <span className="text-sm font-semibold text-primary-foreground">Investment Planning</span>
          </Reveal>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <div className="flex gap-4 lg:col-span-6">
            <Reveal className="flex h-full w-[48%] shrink-0 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <Image src="/svg/key.svg" alt="" width={23} height={23} className="h-6 w-6" />
              <span className="text-[11px] font-medium text-slate-600">Property Management</span>
            </Reveal>
            <Reveal
              delay={0.06}
              className="flex h-full w-[48%] shrink-0 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
            >
              <Image src="/svg/headphone.svg" alt="" width={18} height={18} className="h-6 w-6" />
              <span className="text-[11px] font-medium text-slate-600">Customer Support</span>
            </Reveal>
          </div>

          <Reveal
            delay={0.12}
            className="flex flex-1 flex-col justify-center gap-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 lg:col-span-6"
          >
            <p className="text-sm italic leading-relaxed text-muted-foreground">
              &ldquo;We measure ourselves not by transactions closed, but by relationships that stay meaningful a
              decade later.&rdquo;
            </p>
            <CardEyebrow className="text-slate-400">Founding Partner</CardEyebrow>
          </Reveal>
        </div>
      </div>
    </section>
  );
}