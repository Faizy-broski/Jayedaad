'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useVerificationQueueViewModel } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-web';

// Verification Staff's primary screen [Dev Instr §2.2]. Every action here
// writes an audit log entry server-side (reviewer, timestamp, action, listing).
export default function VerificationQueuePage() {
  const { queue, isLoading, act } = useVerificationQueueViewModel();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const runAction = (listingId: string, action: 'approve' | 'reject') => {
    const note = notes[listingId]?.trim() || undefined;
    act.mutate(
      { listingId, action, note },
      {
        onSuccess: () => {
          toast.success(action === 'approve' ? 'Listing approved.' : 'Listing rejected.');
          setNotes((prev) => ({ ...prev, [listingId]: '' }));
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Verification Queue</h1>
      {isLoading && <p>Loading…</p>}
      <ul className="space-y-3">
        {queue.map((listing) => (
          <li
            key={listing.id}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <span>{listing.title}</span>
              <div className="flex gap-2">
                <Button onClick={() => runAction(listing.id, 'approve')}>Approve</Button>
                <Button variant="secondary" onClick={() => runAction(listing.id, 'reject')}>
                  Reject
                </Button>
              </div>
            </div>
            <textarea
              value={notes[listing.id] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [listing.id]: e.target.value }))}
              placeholder="Optional note (e.g. reason for rejection)…"
              rows={2}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </li>
        ))}
        {!isLoading && queue.length === 0 && <p className="text-slate-500">Nothing pending review.</p>}
      </ul>
    </main>
  );
}
