import Image from 'next/image';
import type { ReactNode } from 'react';
import { ShieldCheck, Activity, Landmark, TrendingUp, Briefcase, Headset } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

function CardEyebrow({ children }: { children: ReactNode }) {
  return <span className="relative z-10 text-[10px] font-semibold uppercase tracking-widest">{children}</span>;
}

// Boxed icon treatment used throughout — a soft rounded square behind the
// icon instead of a bare glyph, matching the reference design (Landmark,
// chart, TrendingUp all sit inside a tinted well there). `tone` swaps the
// well's background for icons that land on dark/colored card surfaces,
// where bg-primary/10 would disappear or clash.
function IconWell({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <span
      className={
        tone === 'dark'
          ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-white/10'
          : 'flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'
      }
    >
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
            03 — Our Promise
          </span>
          <h2 className="mt-2 max-w-md text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
            A studio approach to real estate.
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <Reveal className="relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl p-5 shadow-sm sm:col-span-2 sm:min-h-[300px] lg:col-span-5 lg:min-h-[350px]">
            <Image
              src="/images/about-us/customer.jpg"
              alt=""
              fill
              sizes="(min-width: 640px) 33vw, 90vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <CardEyebrow>
              <span className="text-white/70">01</span>
            </CardEyebrow>
            <span className="relative z-10 mt-2 text-lg font-semibold text-white">Trusted Agents</span>
            <p className="relative z-10 mt-1 text-xs leading-relaxed text-white/70">
              Advisors selected for judgement, not volume. Long relationships, real conviction.
            </p>
          </Reveal>

          <Reveal
            delay={0.06}
            className="flex min-h-[220px] flex-col justify-between rounded-2xl bg-[#F2F2F2] p-5 shadow-sm ring-1 ring-black/5 lg:col-span-4"
          >
            <CardEyebrow>
              <span className="text-slate-400">02 — Verified Properties</span>
            </CardEyebrow>
            <div>
            <span className="text-heading-gradient text-5xl font-bold sm:text-6xl">100%</span>
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
              <CardEyebrow>
                <span className="text-slate-400">03</span>
              </CardEyebrow>
              <IconWell>
                <ShieldCheck className="h-4 w-4 text-primary" />
              </IconWell>
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
          <Reveal className="relative flex min-h-[160px] flex-col justify-between rounded-2xl bg-brand-dark p-5 shadow-sm sm:col-span-2 lg:col-span-6">
            <CardEyebrow>
              <span className="text-white/50">04 — AI Market Insights</span>
            </CardEyebrow>
            <div className="flex items-end justify-between gap-3">
              <span className="text-lg font-semibold leading-snug text-white">
                Live intelligence on 47 Pakistani submarkets.
              </span>
              <IconWell tone="dark">
                <Activity className="h-4 w-4 text-primary" />
              </IconWell>
            </div>
          </Reveal>

          <Reveal
            delay={0.06}
            className="flex min-h-[160px] flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-3"
          >
            <div className="flex items-start justify-between">
              <CardEyebrow>
                <span className="text-slate-400">05</span>
              </CardEyebrow>
              <IconWell>
                <Landmark className="h-4 w-4 text-primary" />
              </IconWell>
            </div>
            <span className="text-sm font-semibold text-slate-900">Mortgage Guidance</span>
          </Reveal>

          <Reveal
            delay={0.12}
            className="flex min-h-[160px] flex-col justify-between rounded-2xl bg-heading-gradient p-5 shadow-sm lg:col-span-3"
          >
            <div className="flex items-start justify-between">
              <CardEyebrow>
                <span className="text-primary-foreground/70">06 — Portfolio</span>
              </CardEyebrow>
              <IconWell tone="dark">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </IconWell>
            </div>
            <span className="text-sm font-semibold text-primary-foreground">Investment Planning</span>
          </Reveal>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <div className="flex gap-4 lg:col-span-6">
            <Reveal className="flex h-full w-[48%] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-white text-center shadow-sm ring-1 ring-black/5">
              <IconWell>
                <Briefcase className="h-4 w-4 text-primary" />
              </IconWell>
              <span className="text-[11px] font-medium text-slate-600">Property Management</span>
            </Reveal>
            <Reveal
              delay={0.06}
              className="flex h-full w-[48%] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-white text-center shadow-sm ring-1 ring-black/5"
            >
              <IconWell>
                <Headset className="h-4 w-4 text-primary" />
              </IconWell>
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
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              — Founding Partner
            </span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}