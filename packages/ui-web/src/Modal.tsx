import { ReactNode } from 'react';
import { cn } from './lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

// Centered dialog — same backdrop/panel pattern as the slide-over filter
// panel on apps/web/app/(agent)/property-management/page.tsx, just centered
// instead of docked to the right, and reusable.
export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn('relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-background shadow-xl', className)}>
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl leading-none text-muted-foreground hover:text-foreground">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
