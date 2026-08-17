import { Info, LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from './lib/cn';

export type CreditCardAccent = 'green' | 'orange' | 'red' | 'blue' | 'purple';

const ACCENT_CLASSES: Record<CreditCardAccent, string> = {
  green: 'bg-primary/10 text-primary',
  orange: 'bg-orange-500/10 text-orange-600',
  red: 'bg-red-600/10 text-red-600',
  blue: 'bg-blue-600/10 text-blue-600',
  purple: 'bg-purple-600/10 text-purple-600',
};

export interface CreditQuotaCardProps {
  label: string;
  accent: CreditCardAccent;
  icon: LucideIcon;
  available: number;
  used: number;
  // Omitted for Listing Quota — it isn't a purchasable credit type
  // (PurchasableCreditType excludes 'listing_quota'), so there's nothing to
  // buy more of and no banner/link should render.
  onBuyMore?: () => void;
  className?: string;
}

// RN counterpart lives in @jayedaad/ui-native/CreditQuotaCard — one card per
// credit type (Listing Quota, Hot, Super Hot, Refresh, Story), replacing the
// small uniform tiles previously buried inside the Current Plan hero band.
// Takes only primitives (no AgentCredit/SubscriptionUsage import) so this
// package stays free of a @jayedaad/core dependency.
export function CreditQuotaCard({ label, accent, icon: Icon, available, used, onBuyMore, className }: CreditQuotaCardProps) {
  const isEmpty = available <= 0;

  return (
    <Card className={cn('flex flex-col gap-3 p-5', className)}>
      <div className="flex justify-end">
        <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide', ACCENT_CLASSES[accent])}>
          {label}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex min-w-[60px] flex-col items-center gap-1">
          <p className="text-3xl font-extrabold text-foreground">{available}</p>
          <div className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', isEmpty ? 'bg-muted-foreground/40' : 'bg-emerald-500')} />
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Icon className={cn('h-5 w-5', ACCENT_CLASSES[accent].split(' ')[1])} />
        </div>

        <div className="flex min-w-[60px] flex-col items-center gap-1">
          <p className="text-3xl font-extrabold text-foreground">{used}</p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">Used</span>
          </div>
        </div>
      </div>

      {isEmpty && onBuyMore && (
        <button
          type="button"
          onClick={onBuyMore}
          className="flex flex-wrap items-center gap-1.5 rounded-md bg-amber-100 px-3 py-2 text-left text-xs text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-400"
        >
          <Info className="h-4 w-4 shrink-0" />
          <span>No credits available.</span>
          <span className="font-bold">Buy more →</span>
        </button>
      )}
    </Card>
  );
}
