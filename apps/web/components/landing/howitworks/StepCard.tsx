import type { HowItWorksStep } from '@/lib/types';

export function StepCard({ step }: { step: HowItWorksStep }) {
  const { number, title, description, icon: Icon } = step;

  return (
    <div className="relative flex w-52 items-start gap-3 rounded-2xl border border-slate-100 bg-white/15 p-4 shadow-md backdrop-blur-sm justify-between">
        <div className='flex-col items-center'>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
    
      <div className="flex flex-col gap-0.5 mt-2">
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <p className="text-xs leading-relaxed text-slate-400">{description}</p>
      </div>
        </div>

      {/* Oversized faint number sits behind the copy, anchored top-right of the card */}
      <span className="pointer-events-none text-5xl font-bold text-slate-100">{number}</span>
    </div>
  );
}