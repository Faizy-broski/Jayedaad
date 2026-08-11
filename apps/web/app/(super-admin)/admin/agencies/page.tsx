'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Agency,
  agenciesRepository,
  AgencyTier,
  AgentCreditType,
  AgentOverview,
  CreateAgencyInput,
  OnboardingDocument,
  OnboardingDocumentType,
  useAdminAgentsViewModel,
  useAdminStatsViewModel,
  useAgencyManagementViewModel,
} from '@jayedaad/core';
import { Badge, Button, cn, Input, Label, Modal, Pagination, Select, Table, TableColumn } from '@jayedaad/ui-web';
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCheck2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  UploadCloud,
  User,
  XCircle,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const EMPTY_FORM: CreateAgencyInput = {
  name: '',
  slug: '',
  description: '',
  phone: '',
  email: '',
  city: '',
  address: '',
  salesAssociateCount: 1,
};

const DOCUMENT_TYPES: { type: OnboardingDocumentType; label: string }[] = [
  { type: 'company_registration', label: 'Company Registration' },
  { type: 'owner_id_card', label: "Owner's ID Card" },
  { type: 'tax_certificate', label: 'Tax Certificate' },
];

type AgencyTab = 'all' | Agency['verificationStatus'] | 'staff';

const STATUS_TABS: { id: 'all' | Agency['verificationStatus']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
];

const CREDIT_TYPES: AgentCreditType[] = ['listing_quota', 'refresh', 'hot', 'super_hot'];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

const PAGE_SIZE = 20;

// Header/tab counts read from GET /admin/stats (true platform totals),
// not from whatever page of results happens to be loaded — now that the
// roster itself is server-side paginated (search/status filters applied
// server-side too, same fix as CRM's search box).
export default function AgenciesPage() {
  const [activeTab, setActiveTab] = useState<AgencyTab>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const isStaffTab = activeTab === 'staff';

  const { agencies, total, isLoading, create, update, setVerificationStatus, setTier, remove } = useAgencyManagementViewModel({
    verificationStatus: isStaffTab || activeTab === 'all' ? undefined : activeTab,
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const { stats } = useAdminStatsViewModel();
  // Staff (agency-affiliated, non-admin agents) live on this page rather
  // than Agents — they're staff *of* an agency, and their account needs no
  // independent verification of its own (the agency's own review already
  // covers them). See useAdminAgentsViewModel::agents for the shape.
  const { agents, grantCredits } = useAdminAgentsViewModel();
  const staffAgents = useMemo(() => agents.filter((a) => a.agency && !a.isAgencyAdmin), [agents]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Agency | null>(null);
  const [docsModalAgency, setDocsModalAgency] = useState<Agency | null>(null);
  const [creditsModalAgent, setCreditsModalAgent] = useState<AgentOverview | null>(null);
  const [creditType, setCreditType] = useState<AgentCreditType>('listing_quota');
  const [creditTotal, setCreditTotal] = useState('');
  const [form, setForm] = useState<CreateAgencyInput>(EMPTY_FORM);
  // Deferred-upload pattern (same as the blog cover image editor): a
  // brand-new agency has no id to upload documents against yet, so files
  // picked while creating are held here and only actually uploaded once
  // `create` resolves and a real agency id exists. Cleared whenever the
  // modal (re)opens.
  const [pendingDocs, setPendingDocs] = useState<Partial<Record<OnboardingDocumentType, File>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const byStatus = stats?.agenciesByVerificationStatus ?? {};
  const counts = {
    total,
    verified: byStatus.verified ?? 0,
    pending: byStatus.pending ?? 0,
    rejected: byStatus.rejected ?? 0,
    staff: staffAgents.length,
  };

  function handleTabChange(next: AgencyTab) {
    setActiveTab(next);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  const visibleStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffAgents.filter(
      (a) =>
        !q ||
        (a.displayName ?? '').toLowerCase().includes(q) ||
        (a.city ?? '').toLowerCase().includes(q) ||
        (a.agency?.name ?? '').toLowerCase().includes(q),
    );
  }, [staffAgents, search]);

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

  const staffColumns: TableColumn<AgentOverview>[] = [
    {
      key: 'agent',
      header: 'Staff member',
      render: (agent) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {agent.displayName ? initials(agent.displayName) : <User className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{agent.displayName ?? 'Unnamed agent'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'agency',
      header: 'Agency',
      render: (agent) => (
        <span className="flex items-center gap-1.5 truncate text-sm text-foreground">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {agent.agency?.name ?? '—'}
        </span>
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
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (agent) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setCreditsModalAgent(agent)}>
            <CreditCard className="mr-1 h-3.5 w-3.5" />
            Credits
          </Button>
        </div>
      ),
    },
  ];

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPendingDocs({});
    setModalOpen(true);
  }

  function openEdit(agency: Agency) {
    setEditing(agency);
    setForm({
      name: agency.name,
      slug: agency.slug,
      description: agency.description ?? '',
      phone: agency.phone ?? '',
      email: agency.email ?? '',
      city: agency.city ?? '',
      address: agency.address ?? '',
      businessHours: agency.businessHours ?? '',
      logoUrl: agency.logoUrl ?? '',
      salesAssociateCount: agency.salesAssociateCount,
    });
    setPendingDocs({});
    setModalOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: form });
        toast.success('Agency updated.');
      } else {
        const created = await create.mutateAsync(form);
        const uploads = Object.entries(pendingDocs) as [OnboardingDocumentType, File][];
        for (const [documentType, file] of uploads) {
          await agenciesRepository.uploadDocument(created.id, documentType, file);
        }
        toast.success('Agency created.');
      }
      setModalOpen(false);
    } catch {
      toast.error('Something went wrong — please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleVerify(id: string, status: 'verified' | 'rejected') {
    // Same optional-reason-on-reject convention as admin/agents/page.tsx.
    const reason = status === 'rejected' ? (prompt('Reason for rejection (optional):') ?? undefined) : undefined;
    setVerificationStatus.mutate(
      { id, input: { status, reason } },
      {
        onSuccess: () => toast.success(`Agency ${status}.`),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    remove.mutate(id, {
      onSuccess: () => toast.success('Agency deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  // Save-on-change, no separate button — same pattern already used for
  // currency/area-unit in agent-settings/page.tsx's PreferencesPanel.
  // setTier existed with zero callers anywhere before this, so every
  // agency was permanently stuck at 'basic' regardless of how established
  // it was — the public /agents directory's Titanium/Featured sections
  // had no real data to ever show.
  function handleTierChange(id: string, tier: AgencyTier) {
    setTier.mutate(
      { id, input: { tier } },
      {
        onSuccess: () => toast.success('Tier updated.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Agency management
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Agencies</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{counts.total}</span> registered{' '}
              {counts.total === 1 ? 'agency' : 'agencies'} — <span className="font-semibold text-foreground">{counts.pending}</span> awaiting
              review.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            New Agency
          </button>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />)
        ) : (
          <>
            <StatTile index={0} icon={Building2} label="Total Agencies" value={counts.total} sub="All registered" />
            <StatTile index={1} icon={ShieldCheck} label="Verified" value={counts.verified} sub="Active & trusted" />
            <StatTile index={2} icon={Clock} label="Pending" value={counts.pending} sub="Awaiting review" />
            <StatTile index={3} icon={ShieldX} label="Rejected" value={counts.rejected} sub="Needs resubmission" />
          </>
        )}
      </div>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
            {[...STATUS_TABS, { id: 'staff' as const, label: 'Agency Staff' }].map((tab) => {
              const count = tab.id === 'all' ? counts.total : counts[tab.id as keyof typeof counts];
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
                      layoutId="agencyStatusTab"
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
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={isStaffTab ? 'Search by name, city, or agency…' : 'Search by name or city…'}
              className="pl-9"
            />
          </div>
        </div>
      </Reveal>

      {isStaffTab ? (
        <Reveal>
          <Table
            columns={staffColumns}
            rows={visibleStaff}
            rowKey={(agent) => agent.id}
            isLoading={isLoading}
            emptyMessage={
              search
                ? 'No staff match your search.'
                : 'No agency staff yet — added via an agency admin’s Agency Staff screen.'
            }
          />
        </Reveal>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : agencies.length === 0 ? (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No agencies found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || activeTab !== 'all' ? 'Try a different search or filter.' : 'New agencies will appear here once registered.'}
            </p>
          </div>
        </Reveal>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency, index) => (
            <motion.li
              key={agency.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.05 }}
            >
              <div className="flex h-full flex-col rounded-xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {agency.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={agency.logoUrl} alt={agency.name} className="h-full w-full object-cover" />
                      ) : (
                        initials(agency.name) || <Building2 className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{agency.name}</p>
                      <p className="truncate text-xs text-muted-foreground">@{agency.slug}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      agency.verificationStatus === 'verified' ? 'success' : agency.verificationStatus === 'rejected' ? 'destructive' : 'warning'
                    }
                  >
                    {agency.verificationStatus}
                  </Badge>
                </div>

                <div className="mt-4 flex-1 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {agency.city ?? '—'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {agency.phone ?? '—'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{agency.email ?? '—'}</span>
                  </p>
                </div>

                <div className="mt-3 space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Tier</Label>
                  <Select
                    value={agency.tier}
                    onChange={(e) => handleTierChange(agency.id, e.target.value as AgencyTier)}
                    className="h-8 text-xs"
                  >
                    <option value="basic">Basic</option>
                    <option value="featured">Featured</option>
                    <option value="titanium">Titanium</option>
                  </Select>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {agency.verificationStatus !== 'verified' && (
                    <Button size="sm" variant="outline" className="text-primary" onClick={() => handleVerify(agency.id, 'verified')}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Verify
                    </Button>
                  )}
                  {agency.verificationStatus !== 'rejected' && (
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleVerify(agency.id, 'rejected')}>
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      Reject
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(agency)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDocsModalAgency(agency)}>
                    <FileCheck2 className="mr-1 h-3.5 w-3.5" />
                    Documents
                  </Button>
                  <Button size="sm" variant="outline" className="ml-auto text-destructive" onClick={() => handleDelete(agency.id, agency.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      {!isStaffTab && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Agency' : 'New Agency'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                disabled={!!editing}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Sales Associate Count</Label>
              <Input
                type="number"
                min={1}
                value={form.salesAssociateCount ?? 1}
                onChange={(e) => setForm((prev) => ({ ...prev, salesAssociateCount: Number(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving…' : 'Save'}
          </Button>

          {/* Same fields the self-service onboarding flow (become-an-agent)
              collects, available up front here too — for a brand-new agency
              (no id yet) files are held locally and uploaded right after
              create() resolves; for an existing one they upload immediately. */}
          <AgencyDocumentsSection
            agencyId={editing?.id}
            pendingDocs={pendingDocs}
            onPendingFileChange={(type, file) => setPendingDocs((prev) => ({ ...prev, [type]: file }))}
          />
        </div>
      </Modal>

      {/* Standalone "Documents" button/modal — a direct one-click path to
          View/download an agency's verification documents, instead of
          having to open Edit and scroll past the whole agency-details form
          just to reach the Verification Documents section at the bottom. */}
      <Modal open={!!docsModalAgency} onClose={() => setDocsModalAgency(null)} title={`Documents — ${docsModalAgency?.name ?? ''}`}>
        {docsModalAgency && (
          <AgencyDocumentsSection agencyId={docsModalAgency.id} pendingDocs={{}} onPendingFileChange={() => {}} bordered={false} />
        )}
      </Modal>

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
  icon: typeof Building2;
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

// Two modes in one component: with an agencyId (editing), files upload
// immediately, same as before. Without one (creating), file picks are just
// reported up to the parent's pendingDocs state via onPendingFileChange —
// the parent uploads them right after create() resolves in handleSave.
function AgencyDocumentsSection({
  agencyId,
  pendingDocs,
  onPendingFileChange,
  bordered = true,
}: {
  agencyId?: string;
  pendingDocs: Partial<Record<OnboardingDocumentType, File>>;
  onPendingFileChange: (type: OnboardingDocumentType, file: File) => void;
  /** false when standing alone in its own modal (the Documents button)
   * rather than tacked onto the bottom of the Edit Agency form. */
  bordered?: boolean;
}) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'agencies', agencyId, 'documents'];

  const { data: documents, isLoading } = useQuery({
    queryKey,
    queryFn: () => agenciesRepository.listDocuments(agencyId!),
    enabled: !!agencyId,
  });

  // `url` is a signed URL good for 1 hour (agencies.repository.ts::
  // listDocuments re-signs it fresh on every call) — keyed by documentType
  // so a re-uploaded doc's row always links to the latest file.
  //
  // listDocuments returns every historical row (newest first) since replace
  // inserts rather than overwrites — take the first (newest) row per type,
  // not `new Map(entries)`'s last-one-wins, which would keep the oldest.
  const docByType = new Map<OnboardingDocumentType, OnboardingDocument>();
  for (const d of documents ?? []) {
    if (!docByType.has(d.documentType)) docByType.set(d.documentType, d);
  }

  return (
    <div className={cn('space-y-3', bordered && 'border-t border-border pt-4')}>
      <h3 className="flex items-center gap-1.5 text-sm font-medium">
        <FileCheck2 className="h-4 w-4 text-muted-foreground" />
        Verification Documents
      </h3>
      <p className="text-xs text-muted-foreground">All three documents are required before this agency can be verified.</p>
      {agencyId && isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        DOCUMENT_TYPES.map((doc) => (
          <AgencyDocumentRow
            key={doc.type}
            agencyId={agencyId}
            documentType={doc.type}
            label={doc.label}
            document={docByType.get(doc.type)}
            pendingFile={pendingDocs[doc.type]}
            onUploaded={() => queryClient.invalidateQueries({ queryKey })}
            onPendingFileChange={onPendingFileChange}
          />
        ))
      )}
    </div>
  );
}

function AgencyDocumentRow({
  agencyId,
  documentType,
  label,
  document,
  pendingFile,
  onUploaded,
  onPendingFileChange,
}: {
  agencyId?: string;
  documentType: OnboardingDocumentType;
  label: string;
  document: OnboardingDocument | undefined;
  pendingFile: File | undefined;
  onUploaded: () => void;
  onPendingFileChange: (type: OnboardingDocumentType, file: File) => void;
}) {
  const uploaded = !!document;
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!agencyId) {
      onPendingFileChange(documentType, file);
      return;
    }

    setIsUploading(true);
    try {
      await agenciesRepository.uploadDocument(agencyId, documentType, file);
      onUploaded();
      toast.success(`${label} uploaded.`);
    } catch {
      toast.error('Upload failed — please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  const isDone = uploaded || !!pendingFile;
  const actionLabel = isUploading ? 'Uploading…' : pendingFile ? 'Change' : isDone ? 'Replace' : 'Upload';

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-sm">
        {label}
        {uploaded && (
          <span className="flex items-center gap-1 text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Uploaded
          </span>
        )}
        {!uploaded && pendingFile && <span className="text-xs text-muted-foreground">Uploads when you save</span>}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {document && (
          <a
            href={document.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
          >
            <Download className="h-3.5 w-3.5" />
            View
          </a>
        )}
        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">
          <UploadCloud className="h-3.5 w-3.5" />
          {actionLabel}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
    </div>
  );
}
