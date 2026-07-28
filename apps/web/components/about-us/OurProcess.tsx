import Image from 'next/image';
import { Reveal } from '@/components/Reveal';
import { ABOUT_PROCESS_STEPS } from '@/data/aboutProcess';

export function OurProcess() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      {/* Faint building watermark, same treatment used elsewhere on the site. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 left-1/3 h-full max-w-4xl opacity-70">
        <Image src="/images/logo-right.png" alt="" fill sizes="100vw" className="object-contain object-right" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            03 — Our Process
          </span>
          <h2 className="mt-2 max-w-md text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
            Five careful steps between you and home.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-5">
          {ABOUT_PROCESS_STEPS.map((step, index) => (
            <Reveal key={step.id} delay={index * 0.08} className="relative flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-heading-gradient" />
                <span className="text-xs font-medium text-slate-400">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {index < ABOUT_PROCESS_STEPS.length - 1 && (
                  <span className="hidden h-px flex-1 bg-slate-200 sm:block" />
                )}
              </div>
              <span className="text-lg font-semibold text-slate-900">{step.title}</span>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
