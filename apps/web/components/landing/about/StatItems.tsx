import type { Stat } from '@/lib/types';

export function StatItem({ stat, index }: { stat: Stat; index: number }) {
  return (
    <div className="flex flex-col gap-2 items-center sm:items-start">
      <span className="text-xs font-medium text-slate-400">/ 0{index + 1}</span>
      <span className="text-heading-gradient text-4xl font-bold sm:text-5xl">{stat.value}</span>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</span>
    </div>
  );
}