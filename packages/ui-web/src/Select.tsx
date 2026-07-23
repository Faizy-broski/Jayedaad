import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from './lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

// Deliberately a plain native <select> wrapper, not shadcn's usual
// Radix-based Select (which adds search/multi-select/portal behavior at the
// cost of a new dependency) — every dropdown in this app today (city,
// property type, area unit, ...) is a simple single-value choice a native
// select handles fine. Swap this out for a Radix-based one later if a
// screen genuinely needs combobox/search behavior.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
