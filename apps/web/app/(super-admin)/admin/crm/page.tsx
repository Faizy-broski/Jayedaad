'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Lead, useAdminAgentsViewModel, useAdminCrmViewModel } from '@jayedaad/core';
import { Button, Select, Table, TableColumn } from '@jayedaad/ui-web';

// Super Admin cross-agent CRM — same GET /crm/leads endpoint the agent
// Inbox uses, unscoped, with an agent filter/attribution column since rows
// are no longer implicitly scoped to one agent.
export default function AdminCrmPage() {
  const { agents } = useAdminAgentsViewModel();
  const [agentFilter, setAgentFilter] = useState('');
  const { leads, isLoading, updateStatus, assign } = useAdminCrmViewModel({ agentId: agentFilter || undefined });

  const agentName = (id: string | null) => (id ? agents.find((a) => a.id === id)?.displayName ?? id : 'Unassigned');

  function handleReassign(leadId: string, agentId: string) {
    if (!agentId) return;
    assign.mutate(
      { leadId, agentId },
      {
        onSuccess: () => toast.success('Lead reassigned.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  const columns: TableColumn<Lead>[] = [
    { key: 'name', header: 'Name', render: (l) => l.name },
    { key: 'phone', header: 'Phone', render: (l) => l.phone },
    { key: 'agent', header: 'Agent', render: (l) => agentName(l.agentId) },
    { key: 'status', header: 'Status', className: 'capitalize', render: (l) => l.status },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (l) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ leadId: l.id, status: 'contacted' })}
          >
            Mark Contacted
          </Button>
          <Select
            className="h-8 w-40 py-0 text-xs"
            value=""
            onChange={(e) => handleReassign(l.id, e.target.value)}
          >
            <option value="">Reassign to…</option>
            {agents
              .filter((a) => a.id !== l.agentId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName ?? a.id}
                </option>
              ))}
          </Select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CRM — All Agents</h1>
        <Select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="w-56">
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName ?? a.id}
            </option>
          ))}
        </Select>
      </div>

      <Table columns={columns} rows={leads} rowKey={(l) => l.id} isLoading={isLoading} emptyMessage="No leads." />
    </div>
  );
}
