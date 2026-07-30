'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { AgentCreditType, AgentOverview, useAdminAgentsViewModel } from '@jayedaad/core';
import { Badge, Button, Input, Label, Modal, Select, Table, TableColumn } from '@jayedaad/ui-web';

const CREDIT_TYPES: AgentCreditType[] = ['listing_quota', 'refresh', 'hot', 'super_hot'];

export default function AgentsPage() {
  const { agents, isLoading, grantCredits, setVerificationStatus } = useAdminAgentsViewModel();
  const [creditsModalAgent, setCreditsModalAgent] = useState<AgentOverview | null>(null);
  const [creditType, setCreditType] = useState<AgentCreditType>('listing_quota');
  const [creditTotal, setCreditTotal] = useState('');

  function handleVerify(agentId: string, status: 'verified' | 'rejected') {
    setVerificationStatus.mutate(
      { agentId, status },
      {
        onSuccess: () => toast.success(`Agent ${status}.`),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleGrantCredits() {
    if (!creditsModalAgent) return;
    grantCredits.mutate(
      { agentId: creditsModalAgent.id, input: { creditType, total: creditTotal ? Number(creditTotal) : undefined } },
      {
        onSuccess: () => {
          toast.success('Credits updated.');
          setCreditsModalAgent(null);
          setCreditTotal('');
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  const columns: TableColumn<AgentOverview>[] = [
    { key: 'name', header: 'Agent', render: (a) => a.displayName ?? '—' },
    { key: 'phone', header: 'Phone', render: (a) => a.phone ?? '—' },
    { key: 'city', header: 'City', render: (a) => a.city ?? '—' },
    { key: 'agency', header: 'Agency', render: (a) => a.agency?.name ?? 'Independent' },
    { key: 'plan', header: 'Plan', render: (a) => a.subscription?.tierName ?? '—' },
    { key: 'listings', header: 'Listings', render: (a) => `${a.listingCounts.verified} / ${a.listingCounts.total}` },
    {
      key: 'verification',
      header: 'Verification',
      render: (a) => (
        <Badge variant={a.verificationStatus === 'verified' ? 'success' : a.verificationStatus === 'rejected' ? 'destructive' : 'warning'}>
          {a.verificationStatus}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end gap-2">
          {a.verificationStatus !== 'verified' && (
            <Button size="sm" variant="outline" onClick={() => handleVerify(a.id, 'verified')}>
              Verify
            </Button>
          )}
          {a.verificationStatus !== 'rejected' && (
            <Button size="sm" variant="outline" onClick={() => handleVerify(a.id, 'rejected')}>
              Reject
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setCreditsModalAgent(a)}>
            Credits
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Agents</h1>

      <Table columns={columns} rows={agents} rowKey={(a) => a.id} isLoading={isLoading} emptyMessage="No agents yet." />

      <Modal
        open={!!creditsModalAgent}
        onClose={() => setCreditsModalAgent(null)}
        title={`Grant Credits — ${creditsModalAgent?.displayName ?? ''}`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Credit type</Label>
            <Select value={creditType} onChange={(e) => setCreditType(e.target.value as AgentCreditType)}>
              {CREDIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Total</Label>
            <Input type="number" value={creditTotal} onChange={(e) => setCreditTotal(e.target.value)} />
          </div>
          <Button onClick={handleGrantCredits} disabled={grantCredits.isPending}>
            {grantCredits.isPending ? 'Saving…' : 'Grant'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
