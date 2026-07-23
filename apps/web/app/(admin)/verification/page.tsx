'use client';

import { useVerificationQueueViewModel } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-web';

// Verification Staff's primary screen [Dev Instr §2.2]. Every action here
// writes an audit log entry server-side (reviewer, timestamp, action, listing).
export default function VerificationQueuePage() {
  const { queue, isLoading, act } = useVerificationQueueViewModel();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Verification Queue</h1>
      {isLoading && <p>Loading…</p>}
      <ul className="space-y-3">
        {queue.map((listing) => (
          <li
            key={listing.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-800"
          >
            <span>{listing.title}</span>
            <div className="flex gap-2">
              <Button onClick={() => act.mutate({ listingId: listing.id, action: 'approve' })}>Approve</Button>
              <Button variant="secondary" onClick={() => act.mutate({ listingId: listing.id, action: 'reject' })}>
                Reject
              </Button>
            </div>
          </li>
        ))}
        {!isLoading && queue.length === 0 && <p className="text-slate-500">Nothing pending review.</p>}
      </ul>
    </main>
  );
}
