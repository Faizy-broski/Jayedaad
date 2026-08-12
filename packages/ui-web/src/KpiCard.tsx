import { ComponentType } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from './lib/cn';

// Same 5-color cycle everywhere a row of KPI cards appears (admin + agent
// dashboards, and every admin list page's summary row) so the icon badges
// read as distinct at a glance without every page picking its own palette.
const ICON_COLORS = [
  'bg-primary/10 text-primary',
  'bg-muted text-muted-foreground',
  'bg-brand-emerald/10 text-brand-emerald',
  'bg-amber-100 text-amber-600',
  'bg-blue-100 text-blue-600',
];

export interface KpiCardProps {
  /** Cycles the icon badge color and staggers entrance animation when the caller wraps this in motion.div. */
  index?: number;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  /** Signed percent change. Renders a green/up or red/down pill when set; omit while no real delta data exists. */
  trend?: number;
  className?: string;
}

export function KpiCard({ index = 0, icon: Icon, label, value, sub, trend, className }: KpiCardProps) {
  return (
    <div className={cn('rounded-[24px] border border-border bg-background p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', ICON_COLORS[index % ICON_COLORS.length])}>
          <Icon className="h-4 w-4" />
        </span>
        {trend !== undefined && <KpiTrendBadge percent={trend} />}
      </div>
      <p className="mt-3 truncate text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function KpiTrendBadge({ percent }: { percent: number }) {
  const isUp = percent >= 0;
  return (
    <span
      className={cn(
        'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        isUp ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-destructive/10 text-destructive',
      )}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(percent)}%
    </span>
  );
}
