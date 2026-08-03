import type { HowItWorksStep } from "@/lib/types";

export function StepCard({ step }: { step: HowItWorksStep }) {
  const { number, title, description, icon: Icon } = step;

  return (
    <div className="relative flex h-full min-h-[180px] sm:min-h-[150px] w-full sm:w-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Background Number */}
      <span className="pointer-events-none absolute right-4 top-2 text-6xl font-bold text-slate-100 sm:text-5xl">
        {number}
      </span>

      {/* Icon */}
      <div className="relative z-10 flex h-12 w-12 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-3 w-3" strokeWidth={1.75} />
      </div>

      {/* Content */}
      <div className="relative z-10 mt-6">
        <h3 className="text-base sm:text-sm  font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-2 text-sm sm:text-xs leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}