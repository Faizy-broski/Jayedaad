'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { ReminderChannel, useLeadRemindersViewModel } from '@jayedaad/core';
import { Button, Select } from '@jayedaad/ui-web';
import { Bell, X } from 'lucide-react';

const CHANNEL_LABELS: Record<ReminderChannel, string> = {
  in_app: 'In-app',
  push: 'Push',
  email: 'Email',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

// Shared by both (agent)/crm/page.tsx and admin/crm/page.tsx — schedules a
// follow-up reminder on a lead. Fired by services/api's RemindersService (a
// @Cron job), which turns a due one into a real notification for the
// lead's assigned agent — see NotificationBell.tsx for where that surfaces.
export function SetReminderPopover({ leadId }: { leadId: string }) {
  const { reminders, create, remove } = useLeadRemindersViewModel(leadId);
  const [open, setOpen] = useState(false);
  const [remindAt, setRemindAt] = useState('');
  const [channel, setChannel] = useState<ReminderChannel>('in_app');
  // Screen coordinates for the portal below — same fix as
  // packages/ui-web/src/Select.tsx: both admin/crm/page.tsx's and
  // (agent)/crm/page.tsx's per-lead rows are `motion.li layout
  // whileHover={{ y: -2 }}`, and Framer Motion implements layout/whileHover
  // via an inline CSS transform, which creates a new stacking context on
  // that row. A position:absolute panel rendered inside this component's
  // own div was trapped in that row's stacking context and could never
  // paint above a later sibling row, no matter its z-index — see Select.tsx
  // for the fuller writeup of the same bug.
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      // The panel now lives in a document.body portal, outside this div's
      // subtree — without also checking panelRef, every click inside the
      // panel (the date input, Select, Set reminder button) would register
      // as "outside" and close it before its own handler could fire.
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function updateRect() {
      const el = buttonRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + 8, left: r.left });
    }
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open]);

  function handleCreate() {
    if (!remindAt) return;
    const iso = new Date(remindAt).toISOString();
    create.mutate(
      { remindAt: iso, channel },
      {
        onSuccess: () => {
          toast.success('Reminder set.');
          setRemindAt('');
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  const pendingCount = reminders.filter((r) => !r.firedAt).length;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-3.5 w-3.5" />
        {pendingCount > 0 ? `Reminder (${pendingCount})` : 'Remind me'}
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: rect.top, left: rect.left }}
            className="fixed z-50 w-72 rounded-xl border border-border bg-background p-3 shadow-lg"
          >
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={remindAt}
                onChange={(e) => setRemindAt(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Select value={channel} onChange={(e) => setChannel(e.target.value as ReminderChannel)} className="h-9 text-xs">
                {(Object.keys(CHANNEL_LABELS) as ReminderChannel[]).map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABELS[c]}
                  </option>
                ))}
              </Select>
              <Button size="sm" className="w-full" disabled={!remindAt || create.isPending} onClick={handleCreate}>
                Set reminder
              </Button>
            </div>

            {reminders.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className={r.firedAt ? 'text-muted-foreground line-through' : 'text-foreground'}>
                      {formatDate(r.remindAt)} · {CHANNEL_LABELS[r.channel]}
                    </span>
                    {!r.firedAt && (
                      <button type="button" onClick={() => remove.mutate(r.id)} aria-label="Cancel reminder">
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
