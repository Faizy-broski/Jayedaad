'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { VerificationAuditAction, VerificationAuditLogEntry, useUserManagementViewModel, useVerificationAuditLogViewModel } from '@jayedaad/core';
import { cn, KpiCard, Pagination } from '@jayedaad/ui-web';
import { CheckCircle2, Clock, FileSearch, HelpCircle, ScrollText, XCircle } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const ACTION_FILTERS: { id: VerificationAuditAction | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'approve', label: 'Approved' },
  { id: 'reject', label: 'Rejected' },
  { id: 'request_info', label: 'Info Requested' },
];

const ACTION_STYLE: Record<VerificationAuditAction, { icon: typeof CheckCircle2; badge: string; dot: string }> = {
  approve: { icon: CheckCircle2, badge: 'bg-primary/10 text-primary', dot: 'bg-primary' },
  reject: { icon: XCircle, badge: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  request_info: {
    icon: HelpCircle,
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const PAGE_SIZE = 20;

// Read-only history of every approve/reject/request_info decision — reviewer
// names resolved client-side against the (already-fetched-elsewhere) user
// list since GET /verification/audit-log only returns reviewerId. Stat tiles
// are real counts over the entries currently loaded (this page of results),
// same "compute from what's already loaded" approach as the rest of admin.
export default function VerificationLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<VerificationAuditAction | 'all'>('all');
  const { entries, total, isLoading } = useVerificationAuditLogViewModel({
    action: actionFilter === 'all' ? undefined : actionFilter,
    page,
    pageSize: PAGE_SIZE,
  });
  const { users } = useUserManagementViewModel();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const reviewerName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user?.displayName ?? user?.email ?? id;
  };

  const counts = useMemo(
    () => ({
      total: entries.length,
      approved: entries.filter((e) => e.action === 'approve').length,
      rejected: entries.filter((e) => e.action === 'reject').length,
      infoRequested: entries.filter((e) => e.action === 'request_info').length,
    }),
    [entries],
  );

  function handleActionFilterChange(next: VerificationAuditAction | 'all') {
    setActionFilter(next);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ScrollText className="h-4 w-4" />
            Verification history
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Verification Audit Log</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span> decision{total === 1 ? '' : 's'} recorded across every listing review.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-2xl border border-border bg-muted/40" />)
        ) : (
          <>
            {[
              { icon: FileSearch, label: 'On This Page', value: counts.total, sub: 'Reviewed decisions' },
              { icon: CheckCircle2, label: 'Approved', value: counts.approved, sub: 'Listings verified' },
              { icon: XCircle, label: 'Rejected', value: counts.rejected, sub: 'Listings declined' },
              { icon: HelpCircle, label: 'Info Requested', value: counts.infoRequested, sub: 'Sent back to agent' },
            ].map((tile, index) => (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <KpiCard index={index} {...tile} />
              </motion.div>
            ))}
          </>
        )}
      </div>

      <Reveal>
        <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleActionFilterChange(f.id)}
              className={cn(
                'relative shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                actionFilter === f.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {actionFilter === f.id && (
                <motion.span
                  layoutId="verificationLogActionPill"
                  className="bg-heading-gradient absolute inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          ))}
        </div>
      </Reveal>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <ScrollText className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No entries found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {actionFilter === 'all' ? 'Verification decisions will appear here.' : 'No entries with this action yet.'}
            </p>
          </div>
        </Reveal>
      )}

      {!isLoading && entries.length > 0 && (
        <>
          <ul className="relative space-y-3 before:absolute before:bottom-2 before:left-[23px] before:top-2 before:w-px before:bg-border sm:before:left-[27px]">
            <AnimatePresence initial={false}>
              {entries.map((entry: VerificationAuditLogEntry, index) => {
                const style = ACTION_STYLE[entry.action];
                const Icon = style.icon;
                return (
                  <motion.li
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
                    className="relative flex gap-3 pl-0 sm:gap-4"
                  >
                    <span className={cn('relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12', style.badge)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', style.badge)}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
                              {entry.action.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-muted-foreground">by {reviewerName(entry.reviewerId)}</span>
                          </div>
                          <Link
                            href={`/admin/listings/${entry.listingId}`}
                            className="mt-1 block truncate font-mono text-xs text-primary hover:underline"
                          >
                            Listing {entry.listingId.slice(0, 8)}…
                          </Link>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" title={new Date(entry.createdAt).toLocaleString()}>
                          <Clock className="h-3 w-3" />
                          {relativeTime(entry.createdAt)}
                        </span>
                      </div>
                      {entry.note && <p className="mt-2 text-sm leading-relaxed text-foreground/90">{entry.note}</p>}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
