import { HTMLAttributes, forwardRef } from 'react';
import { cn } from './lib/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-primary/10 text-primary',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  destructive: 'bg-destructive/10 text-destructive',
};

// Small status/role pill — replaces the ad hoc `rounded-full bg-muted
// px-2 py-0.5 text-xs` spans duplicated across property-management/crm/
// agent-settings pages with one shared component.
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = 'default', ...props }, ref) => (
  <span
    ref={ref}
    className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', VARIANT_CLASSES[variant], className)}
    {...props}
  />
));
Badge.displayName = 'Badge';
