'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthViewModel, useNotificationsViewModel } from '@jayedaad/core';
import { Bell, CheckCheck, Inbox } from 'lucide-react';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Shared by (agent)/layout.tsx and (super-admin)/layout.tsx — both had a
// dead Bell button with no dropdown/count at all. GET /notifications and
// the mark-read endpoints already existed and worked server-side; nothing
// in the UI ever called them until now, so every notification produced by
// the CRM overhaul (new lead, assignment, status change) and reminders was
// write-only.
export function NotificationBell() {
  const router = useRouter();
  const { role } = useAuthViewModel();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotificationsViewModel();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click-through routing — every other notification type stays
  // mark-read-only (no relevant page to jump to yet). support_ticket: a new
  // agent ticket notifies every super_admin (support.repository.ts's
  // notifySuperAdmins), routes to the help desk. new_match: created by
  // saved-search-alerts.service.ts's hourly cron when a buyer's saved
  // search matches a new listing — routes to that listing instead of
  // leaving the buyer with nowhere to click through to. lead_assigned
  // routes to /crm (or /admin/crm for a super_admin recipient — unassigned
  // leads notify every super_admin, who don't have access to the
  // agent-scoped /crm route) — neither page has a per-lead route to
  // deep-link into (unlike mobile's LeadDetail screen, which takes a
  // leadId directly), so this lands on the inbox rather than a specific
  // lead. verification_status (agent/agency verified/rejected, listing
  // verified/rejected) routes to /become-an-agent, which already reads
  // both an agent's own and their agency's verificationStatus — good
  // enough as "where to check on it" even for the listing-verification
  // case; super_admins never receive this type so no role branch is needed.
  function handleNotificationClick(id: string, type: string, readAt: string | null, relatedListingId: string | null) {
    if (!readAt) markRead.mutate(id);
    if (type === 'support_ticket') {
      setOpen(false);
      router.push('/admin/support');
    } else if (type === 'new_match' && relatedListingId) {
      setOpen(false);
      router.push(`/listings/${relatedListingId}`);
    } else if (type === 'lead_assigned') {
      setOpen(false);
      router.push(role === 'super_admin' ? '/admin/crm' : '/crm');
    } else if (type === 'verification_status') {
      setOpen(false);
      router.push('/become-an-agent');
    }
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-destructive" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">Loading…</p>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Inbox className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">Nothing yet.</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n.id, n.type, n.readAt, n.relatedListingId)}
                      className={`w-full border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50 ${
                        n.readAt ? '' : 'bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">{n.title}</p>
                          {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                          <p className="mt-1 text-[10px] text-muted-foreground">{relativeTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
