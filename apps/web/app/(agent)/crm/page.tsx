'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLeadInboxViewModel } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-web';

// Agent/J.Team CRM inbox — daily-driver screen [Dev Instr §1]. Scoping (agent
// sees own leads, J.Team sees all) is enforced server-side by the API, not here.
export default function CrmPage() {
  const { leads, isLoading, updateStatus, addNote } = useLeadInboxViewModel({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const submitNote = (leadId: string) => {
    const body = draftNotes[leadId]?.trim();
    if (!body) return;
    addNote.mutate(
      { leadId, body },
      {
        onSuccess: () => {
          toast.success('Note added.');
          setDraftNotes((prev) => ({ ...prev, [leadId]: '' }));
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Inquiry Inbox</h1>
      {isLoading && <p>Loading…</p>}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="py-2">Name</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Note</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-slate-100 dark:border-slate-900">
              <td className="py-2">{lead.name}</td>
              <td>{lead.phone}</td>
              <td className="capitalize">{lead.status}</td>
              <td>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draftNotes[lead.id] ?? ''}
                    onChange={(e) => setDraftNotes((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                    placeholder="Add a note…"
                    className="w-40 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <Button
                    variant="secondary"
                    disabled={!draftNotes[lead.id]?.trim() || addNote.isPending}
                    onClick={() => submitNote(lead.id)}
                  >
                    Add
                  </Button>
                </div>
              </td>
              <td>
                <Button
                  variant="secondary"
                  onClick={() =>
                    updateStatus.mutate(
                      { leadId: lead.id, status: 'contacted' },
                      {
                        onSuccess: () => toast.success('Lead marked as contacted.'),
                        onError: () => toast.error('Something went wrong — please try again.'),
                      },
                    )
                  }
                >
                  Mark Contacted
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
