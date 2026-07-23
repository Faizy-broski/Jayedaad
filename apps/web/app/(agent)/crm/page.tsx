'use client';

import { useLeadInboxViewModel } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-web';

// Agent/J.Team CRM inbox — daily-driver screen [Dev Instr §1]. Scoping (agent
// sees own leads, J.Team sees all) is enforced server-side by the API, not here.
export default function CrmPage() {
  const { leads, isLoading, updateStatus } = useLeadInboxViewModel({});

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
                <Button
                  variant="secondary"
                  onClick={() => updateStatus.mutate({ leadId: lead.id, status: 'contacted' })}
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
