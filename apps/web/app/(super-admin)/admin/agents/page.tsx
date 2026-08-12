'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  agentsRepository,
  AgentCreditType,
  AgentOverview,
  CreateUserInput,
  OnboardingDocumentType,
  PAKISTAN_CITIES,
  UpdateAgentProfileInput,
  useAdminAgentsViewModel,
  useAdminStatsViewModel,
  useAgencyManagementViewModel,
  useUserManagementViewModel,
} from '@jayedaad/core';
import { Badge, Button, cn, Input, KpiCard, Label, Modal, Pagination, Select, Table, TableColumn } from '@jayedaad/ui-web';
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  Pencil,
  PlusCircle,
  Search,
  ShieldCheck,
  ShieldX,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { AgentDocumentsSection } from '@/components/agents/AgentDocumentsSection';

const CREDIT_TYPES: AgentCreditType[] = ['listing_quota', 'refresh', 'hot', 'super_hot'];
const EMPTY_NEW_AGENT_FORM: CreateUserInput = { email: '', password: '', role: 'agent', displayName: '' };

type AgentTab = 'all' | 'pending' | 'verified' | 'rejected';

const STATUS_TABS: { id: AgentTab; label: string }[] = [
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

const PAGE_SIZE = 20;

// Header stat tiles read from GET /admin/stats (true platform totals) —
// now that the roster itself is server-side paginated, computing these from
// whatever page happens to be loaded would silently under-count, same fix
// applied to Agencies/Users.
export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState<AgentTab>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { agents, total, isLoading, grantCredits, setVerificationStatus, updateProfile } = useAdminAgentsViewModel({
    // A row added through an agency admin's "Agency Staff" screen needs no
    // individual identity verification of its own — same reasoning as it
    // being exempt from the document-completeness gate (see
    // agents.repository.ts::setVerificationStatus's `if (!agent.agency_id)`)
    // — the agency's own review already covers it. Only independent agents
    // and the one admin who registered/owns each agency go through the
    // Verify/Reject queue here; every other agency-linked row lives on the
    // Agencies page's own "Staff" tab instead (it's staff *of* an agency),
    // with no verification actions at all.
    reviewableOnly: true,
    verificationStatus: activeTab === 'all' ? undefined : activeTab,
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const { stats, isLoading: isStatsLoading } = useAdminStatsViewModel();
  const queryClient = useQueryClient();
  const [creditsModalAgent, setCreditsModalAgent] = useState<AgentOverview | null>(null);
  const [docsModalAgent, setDocsModalAgent] = useState<AgentOverview | null>(null);
  const [editingAgent, setEditingAgent] = useState<AgentOverview | null>(null);
  const [editForm, setEditForm] = useState<UpdateAgentProfileInput>({});
  const [creditType, setCreditType] = useState<AgentCreditType>('listing_quota');
  const [creditTotal, setCreditTotal] = useState('');

  // New Agent — reuses the exact same account-creation path as
  // admin/users/page.tsx's "New User" modal (role locked to 'agent' here,
  // no role selector), so this is a shortcut into that same flow, not a
  // second implementation of it.
  const { create: createUser } = useUserManagementViewModel();
  const { agencies } = useAgencyManagementViewModel({ pageSize: 100 });
  const [newAgentModalOpen, setNewAgentModalOpen] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState<CreateUserInput>(EMPTY_NEW_AGENT_FORM);
  const [newAgentPendingDocs, setNewAgentPendingDocs] = useState<Partial<Record<OnboardingDocumentType, File>>>({});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const counts = {
    total,
    verified: stats?.agentsByVerificationStatus?.verified ?? 0,
    pending: stats?.agentsByVerificationStatus?.pending ?? 0,
    rejected: stats?.agentsByVerificationStatus?.rejected ?? 0,
  };

  function handleTabChange(next: AgentTab) {
    setActiveTab(next);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleVerify(agentId: string, status: 'verified' | 'rejected') {
    // Only rejects prompt — approvals need no explanation. Cancelling the
    // prompt (null) still proceeds with no reason, same as before this was
    // added; the prompt is a chance to explain, not a hard requirement.
    const reason = status === 'rejected' ? (prompt('Reason for rejection (optional):') ?? undefined) : undefined;
    setVerificationStatus.mutate(
      { agentId, status, reason },
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

  function openEdit(agent: AgentOverview) {
    setEditingAgent(agent);
    setEditForm({ displayName: agent.displayName ?? '', phone: agent.phone ?? '', city: agent.city ?? '' });
  }

  function handleSaveEdit() {
    if (!editingAgent) return;
    updateProfile.mutate(
      { agentId: editingAgent.id, input: editForm },
      {
        onSuccess: () => {
          toast.success('Agent updated.');
          setEditingAgent(null);
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function openNewAgent() {
    setNewAgentForm(EMPTY_NEW_AGENT_FORM);
    setNewAgentPendingDocs({});
    setNewAgentModalOpen(true);
  }

  async function handleCreateAgent() {
    try {
      const created = await createUser.mutateAsync(newAgentForm);
      if (created.agentId) {
        const uploads = Object.entries(newAgentPendingDocs) as [OnboardingDocumentType, File][];
        for (const [documentType, file] of uploads) {
          await agentsRepository.uploadDocument(created.agentId, documentType, file);
        }
      }
      // useUserManagementViewModel's own mutation only invalidates
      // ['admin','users'] — this page's roster is a separate query
      // (['admin','agents-overview', ...] via useAdminAgentsViewModel), so
      // without this the new agent wouldn't show up here until a manual refresh.
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents-overview'] });
      toast.success('Agent created.');
      setNewAgentModalOpen(false);
    } catch {
      toast.error('Something went wrong — please try again.');
    }
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
          <Button
            size="sm"
            variant="outline"
            className="text-primary"
            onClick={() => handleVerify(agent.id, 'verified')}
            disabled={agent.verificationStatus === 'verified'}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Verify
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={() => handleVerify(agent.id, 'rejected')}
            disabled={agent.verificationStatus === 'rejected'}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(agent)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCreditsModalAgent(agent)}>
            <CreditCard className="mr-1 h-3.5 w-3.5" />
            Credits
          </Button>
          {/* Agency-affiliated agents are covered by the agency's own
              documents (see AgenciesPage) — only independent agents
              need their own uploaded here. */}
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
              <span className="font-semibold text-foreground">{counts.total}</span> {counts.total === 1 ? 'agent' : 'agents'} awaiting/under review —{' '}
              <span className="font-semibold text-foreground">{counts.pending}</span> pending.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewAgent}
            className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            New Agent
          </button>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-2xl border border-border bg-muted/40" />)
        ) : (
          <>
            {[
              { icon: Users, label: 'Total Agents', value: counts.total, sub: 'All registered' },
              { icon: ShieldCheck, label: 'Verified', value: counts.verified, sub: 'Active & trusted' },
              { icon: Clock, label: 'Pending', value: counts.pending, sub: 'Awaiting review' },
              { icon: ShieldX, label: 'Rejected', value: counts.rejected, sub: 'Needs resubmission' },
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
            {STATUS_TABS.map((tab) => {
              const count = tab.id === 'all' ? counts.total : counts[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
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
            <Input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search by name or city…" className="pl-9" />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <Table
          columns={columns}
          rows={agents}
          rowKey={(agent) => agent.id}
          isLoading={isLoading}
          emptyMessage={
            search ? 'No agents match your search.' : activeTab !== 'all' ? 'No agents match this filter.' : 'New agents will appear here once registered.'
          }
        />
      </Reveal>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

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
        {docsModalAgent && (
          <AgentDocumentsSection agentId={docsModalAgent.id} pendingDocs={{}} onPendingFileChange={() => {}} bordered={false} />
        )}
      </Modal>

      {/* Previously the only way to fix a wrong/missing phone or city on an
          existing agent was to delete and recreate them — PATCH /agents/:id
          already accepted these fields from a super_admin (via
          assertOwnAgentOrAdmin's super_admin bypass), just with no console
          entry point to reach it. */}
      <Modal open={!!editingAgent} onClose={() => setEditingAgent(null)} title={`Edit — ${editingAgent?.displayName ?? ''}`}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={editForm.displayName ?? ''} onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={editForm.phone ?? ''} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Select value={editForm.city ?? ''} onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}>
              <option value="">Select city</option>
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={handleSaveEdit} disabled={updateProfile.isPending} className="w-full">
            {updateProfile.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>

      {/* Shortcut into the same account-creation path as admin/users/page.tsx's
          "New User" modal — role locked to 'agent', same phone/city/agency/
          documents fields, so this page has its own entry point instead of
          only being reachable via Users. */}
      <Modal open={newAgentModalOpen} onClose={() => setNewAgentModalOpen(false)} title="New Agent">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={newAgentForm.email} onChange={(e) => setNewAgentForm((prev) => ({ ...prev, email: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              type="password"
              value={newAgentForm.password}
              onChange={(e) => setNewAgentForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={newAgentForm.displayName ?? ''}
              onChange={(e) => setNewAgentForm((prev) => ({ ...prev, displayName: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={newAgentForm.phone ?? ''} onChange={(e) => setNewAgentForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Select value={newAgentForm.city ?? ''} onChange={(e) => setNewAgentForm((prev) => ({ ...prev, city: e.target.value }))}>
                <option value="">Select city</option>
                {PAKISTAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Agency (optional)</Label>
            <Select
              value={newAgentForm.agencyId ?? ''}
              onChange={(e) => setNewAgentForm((prev) => ({ ...prev, agencyId: e.target.value || undefined }))}
            >
              <option value="">No agency (independent)</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <AgentDocumentsSection
            agentId={undefined}
            pendingDocs={newAgentPendingDocs}
            onPendingFileChange={(type, file) => setNewAgentPendingDocs((prev) => ({ ...prev, [type]: file }))}
            bordered={false}
          />
          <Button onClick={handleCreateAgent} disabled={createUser.isPending} className="w-full">
            {createUser.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
