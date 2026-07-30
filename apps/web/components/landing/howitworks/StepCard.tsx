import type { HowItWorksStep } from '@/lib/types';

export function StepCard({ step }: { step: HowItWorksStep }) {
  const { number, title, description, icon: Icon } = step;

  return (
    <div className="relative flex h-44 w-56 flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-md backdrop-blur-sm sm:h-36 sm:w-52">
      {/* Oversized faint number sits behind the copy, anchored top-right of the card */}
      <span className="pointer-events-none absolute right-3 top-0 text-6xl font-bold text-slate-100">
        {number}
      </span>

      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>

      <div className="relative flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{description}</p>
      </div>
    </div>
  );
}