'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Styled confirm dialog rather than window.confirm() — matches the app's
// own theme instead of the browser's native dialog chrome. Rendered via a
// portal straight to document.body (not through a toast library's own
// positioned wrapper, which can apply a CSS transform that breaks
// `position: fixed` descendants out of true screen-center) — extracted from
// ProjectsListView.tsx's original inline version so every delete/destroy
// confirmation in the app shares one implementation instead of re-declaring
// the same portal/animation JSX per page.
export function ConfirmDialog({ open, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel }: ConfirmDialogProps) {
  // createPortal needs `document`, which doesn't exist during SSR/prerender
  // — mount-gate so this only ever renders client-side, same reasoning as
  // every other portal-based component in this package.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div className="w-80 animate-modal-in rounded-2xl bg-background p-5 shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-foreground">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button size="sm" variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
