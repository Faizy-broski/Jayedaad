'use client';

import toast from 'react-hot-toast';
import { useAgentVerificationQueueViewModel } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-web';

// Staff review queue for self-service agent applications
// (apps/web/app/(buyer)/become-an-agent/page.tsx) — same shell-less pattern
// as apps/web/app/(admin)/verification/page.tsx (shared with
// verification_staff, no persistent nav).
export default function AgentVerificationQueuePage() {
  const { queue, isLoading, act } = useAgentVerificationQueueViewModel();

  function runAction(agentId: string, status: 'verified' | 'rejected') {
    act.mutate(
      { agentId, status },
      {
        onSuccess: () => toast.success(status === 'verified' ? 'Agent approved.' : 'Agent rejected.'),
        // Surface the API's real 400 message (e.g. which required
        // documents are still missing) instead of a generic one — same
        // convention as admin/agents/page.tsx's handleVerify.
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Agent Applications</h1>
      {isLoading && <p>Loading…</p>}
      <ul className="space-y-3">
        {queue.map((agent) => (
          <li key={agent.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{agent.displayName ?? 'Unnamed applicant'}</p>
                <p className="text-sm text-slate-500">
                  {agent.phone ?? '—'} · {agent.city ?? '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => runAction(agent.id, 'verified')}>Approve</Button>
                <Button variant="secondary" onClick={() => runAction(agent.id, 'rejected')}>
                  Reject
                </Button>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className="font-medium">Documents: </span>
              {agent.documents.uploaded.length === 0 ? (
                <span className="text-slate-500">None uploaded yet</span>
              ) : (
                <span>{agent.documents.uploaded.join(', ')}</span>
              )}
              {agent.documents.missing.length > 0 && (
                <span className="text-amber-600"> — missing: {agent.documents.missing.join(', ')}</span>
              )}
            </div>
          </li>
        ))}
        {!isLoading && queue.length === 0 && <p className="text-slate-500">No pending applications.</p>}
      </ul>
    </main>
  );
}
