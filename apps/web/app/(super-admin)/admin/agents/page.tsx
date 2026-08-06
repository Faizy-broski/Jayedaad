'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AgentCreditType, AgentOverview, agentsRepository, OnboardingDocumentType, useAdminAgentsViewModel } from '@jayedaad/core';
import { Badge, Button, cn, Input, Label, Modal, Select, Table, TableColumn } from '@jayedaad/ui-web';
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  Search,
  ShieldCheck,
  ShieldX,
  UploadCloud,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const CREDIT_TYPES: AgentCreditType[] = ['listing_quota', 'refresh', 'hot', 'super_hot'];

// Same set required for an independent agent's own onboarding (agents.repository.ts's
// getDocumentCompleteness), an agency-affiliated agent is covered by the
// agency's own documents instead — see AgentsPage's "Documents" button,
// only shown for agents with no agency.
const DOCUMENT_TYPES: { type: OnboardingDocumentType; label: string }[] = [
  { type: 'owner_id_card', label: "Owner's ID Card" },
  { type: 'company_registration', label: 'Company Registration' },
  { type: 'tax_certificate', label: 'Tax Certificate (optional)' },
];

const STATUS_TABS: { id: 'all' | 'pending' | 'verified' | 'rejected'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

// Real counts derived from the fetched agents list — same "compute from what's
// already loaded" approach as the Agencies page, no fabricated analytics endpoint.
export default function AgentsPage() {
  const { agents, isLoading, grantCredits, setVerificationStatus } = useAdminAgentsViewModel();
  const [creditsModalAgent, setCreditsModalAgent] = useState<AgentOverview | null>(null);
  const [docsModalAgent, setDocsModalAgent] = useState<AgentOverview | null>(null);
  const [creditType, setCreditType] = useState<AgentCreditType>('listing_quota');
  const [creditTotal, setCreditTotal] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(
    () => ({
      total: agents.length,
      verified: agents.filter((a) => a.verificationStatus === 'verified').length,
      pending: agents.filter((a) => a.verificationStatus === 'pending').length,
      rejected: agents.filter((a) => a.verificationStatus === 'rejected').length,
    }),
    [agents],
  );

  const visibleAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      const matchesTab = activeTab === 'all' || a.verificationStatus === activeTab;
      const matchesSearch =
        !q ||
        (a.displayName ?? '').toLowerCase().includes(q) ||
        (a.city ?? '').toLowerCase().includes(q) ||
        (a.agency?.name ?? '').toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [agents, activeTab, search]);

  function handleVerify(agentId: string, status: 'verified' | 'rejected') {
    setVerificationStatus.mutate(
      { agentId, status },
      {
        onSuccess: () => toast.success(`Agent ${status}.`),
        // The API's 400 here is usually a real, specific reason — e.g.
        // AgentsRepository.setVerificationStatus rejects verifying an
        // independent agent (no agency_id) who hasn't uploaded all
        // required onboarding documents yet, and returns exactly which
        // ones are missing in the response body. Surface that instead of
        // a generic message, same convention as signup/verify-email's
        // error handling.
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
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
    {
      key: 'agent',
      header: 'Agent',
      render: (agent) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {agent.displayName ? initials(agent.displayName) : <User className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{agent.displayName ?? 'Unnamed agent'}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              {agent.agency?.name ?? 'Independent'}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'city', header: 'City', render: (agent) => agent.city ?? '—' },
    { key: 'phone', header: 'Phone', render: (agent) => agent.phone ?? '—' },
    { key: 'plan', header: 'Plan', render: (agent) => agent.subscription?.tierName ?? 'No active plan' },
    {
      key: 'listings',
      header: 'Listings',
      render: (agent) => `${agent.listingCounts.verified} / ${agent.listingCounts.total} verified`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (agent) => (
        <Badge variant={agent.verificationStatus === 'verified' ? 'success' : agent.verificationStatus === 'rejected' ? 'destructive' : 'warning'}>
          {agent.verificationStatus}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (agent) => (
        <div className="flex justify-end gap-2">
          {agent.verificationStatus !== 'verified' && (
            <Button size="sm" variant="outline" className="text-primary" onClick={() => handleVerify(agent.id, 'verified')}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Verify
            </Button>
          )}
          {agent.verificationStatus !== 'rejected' && (
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleVerify(agent.id, 'rejected')}>
              <XCircle className="mr-1 h-3.5 w-3.5" />
              Reject
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setCreditsModalAgent(agent)}>
            <CreditCard className="mr-1 h-3.5 w-3.5" />
            Credits
          </Button>
          {/* Agency-affiliated agents are covered by the agency's own
              documents (see AgenciesPage) — only independent agents need
              their own uploaded here. */}
          {!agent.agency && (
            <Button size="sm" variant="outline" onClick={() => setDocsModalAgent(agent)}>
              <FileCheck2 className="mr-1 h-3.5 w-3.5" />
              Documents
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Agent management
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Agents</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{counts.total}</span> registered {counts.total === 1 ? 'agent' : 'agents'} —{' '}
              <span className="font-semibold text-foreground">{counts.pending}</span> awaiting review.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />)
        ) : (
          <>
            <StatTile index={0} icon={Users} label="Total Agents" value={counts.total} sub="All registered" />
            <StatTile index={1} icon={ShieldCheck} label="Verified" value={counts.verified} sub="Active & trusted" />
            <StatTile index={2} icon={Clock} label="Pending" value={counts.pending} sub="Awaiting review" />
            <StatTile index={3} icon={ShieldX} label="Rejected" value={counts.rejected} sub="Needs resubmission" />
          </>
        )}
      </div>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
            {STATUS_TABS.map((tab) => {
              const count = tab.id === 'all' ? counts.total : counts[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="agentStatusTab"
                      className="bg-heading-gradient absolute inset-0 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative">
                    {tab.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, city, or agency…" className="pl-9" />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <Table
          columns={columns}
          rows={visibleAgents}
          rowKey={(agent) => agent.id}
          isLoading={isLoading}
          emptyMessage={
            search || activeTab !== 'all' ? 'No agents match your search or filter.' : 'New agents will appear here once registered.'
          }
        />
      </Reveal>

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
          <Button onClick={handleGrantCredits} disabled={grantCredits.isPending} className="w-full">
            {grantCredits.isPending ? 'Saving…' : 'Grant'}
          </Button>
        </div>
      </Modal>

      {/* On behalf of an independent agent who has no way back into their
          own upload step (become-an-agent/page.tsx's DocumentUploadStep
          only renders once, right after applying) — lets a Super Admin
          unblock a stuck "missing required documents" Verify failure
          directly, per services/api's own @Roles('agent', 'super_admin')
          allowance on POST /agents/:id/documents. */}
      <Modal open={!!docsModalAgent} onClose={() => setDocsModalAgent(null)} title={`Documents — ${docsModalAgent?.displayName ?? ''}`}>
        {docsModalAgent && <AgentDocumentsSection agentId={docsModalAgent.id} />}
      </Modal>
    </div>
  );
}

function AgentDocumentsSection({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'agents', agentId, 'documents'];

  const { data: documents, isLoading } = useQuery({
    queryKey,
    queryFn: () => agentsRepository.listDocuments(agentId),
  });

  const uploadedTypes = new Set((documents ?? []).map((d) => d.documentType));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Owner ID Card and Company Registration are required before this agent can be verified.</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        DOCUMENT_TYPES.map((doc) => (
          <AgentDocumentRow
            key={doc.type}
            agentId={agentId}
            documentType={doc.type}
            label={doc.label}
            uploaded={uploadedTypes.has(doc.type)}
            onUploaded={() => queryClient.invalidateQueries({ queryKey })}
          />
        ))
      )}
    </div>
  );
}

function AgentDocumentRow({
  agentId,
  documentType,
  label,
  uploaded,
  onUploaded,
}: {
  agentId: string;
  documentType: OnboardingDocumentType;
  label: string;
  uploaded: boolean;
  onUploaded: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      await agentsRepository.uploadDocument(agentId, documentType, file);
      onUploaded();
      toast.success(`${label} uploaded.`);
    } catch {
      toast.error('Upload failed — please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-sm">
        {label}
        {uploaded && (
          <span className="flex items-center gap-1 text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Uploaded
          </span>
        )}
      </span>
      <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">
        <UploadCloud className="h-3.5 w-3.5" />
        {isUploading ? 'Uploading…' : uploaded ? 'Replace' : 'Upload'}
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleUpload} />
      </label>
    </div>
  );
}

function StatTile({
  index,
  icon: Icon,
  label,
  value,
  sub,
}: {
  index: number;
  icon: typeof Users;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.06 }}>
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">{value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}
