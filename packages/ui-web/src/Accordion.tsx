'use client';

import { useState } from 'react';
import { cn } from './lib/cn';

export interface AccordionProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

// Expandable/collapsible section — mirrors packages/ui-native/src/Accordion.tsx's
// API (icon/label/children/defaultOpen) so web and mobile share the same
// mental model for per-category rows (e.g. Post Listing's categorized media
// step). Each instance manages its own open state independently. `icon`
// accepts any component with a `className` prop (e.g. a lucide-react icon
// from the app layer) — ui-web itself doesn't depend on an icon library
// (see Select.tsx's ChevronIcon comment for the same rationale), hence the
// inline SVG chevron below instead of importing one.
export function Accordion({ icon: Icon, label, children, defaultOpen = false, className }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('border-b border-border', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="space-y-4 pb-4">{children}</div>}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
