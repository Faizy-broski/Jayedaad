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
// instead of docked to the right, and reusable. Backdrop/panel entrance use
// plain CSS keyframe utilities (animate-fade-in/animate-modal-in, defined in
// apps/web/tailwind.config.ts) rather than framer-motion — this package has
// no motion dependency of its own, and a mount-in animation doesn't need one.
// The scrollable body hides its scrollbar (.no-scrollbar, apps/web/globals.css)
// while staying fully scrollable, so a long form's overflow doesn't interrupt
// the rounded panel with a bar.
export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[85vh] w-full max-w-lg animate-modal-in flex-col overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-black/5',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="no-scrollbar overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
