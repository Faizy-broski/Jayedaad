'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AgentCreditType, AgentOverview, useAdminAgentsViewModel } from '@jayedaad/core';
import { Badge, Button, cn, Input, Label, Modal, Select } from '@jayedaad/ui-web';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  ShieldX,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const CREDIT_TYPES: AgentCreditType[] = ['listing_quota', 'refresh', 'hot', 'super_hot'];

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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : visibleAgents.length === 0 ? (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No agents found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || activeTab !== 'all' ? 'Try a different search or filter.' : 'New agents will appear here once registered.'}
            </p>
          </div>
        </Reveal>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAgents.map((agent, index) => (
            <motion.li
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.05 }}
            >
              <div className="flex h-full flex-col rounded-xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {agent.displayName ? initials(agent.displayName) : <User className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{agent.displayName ?? 'Unnamed agent'}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3 shrink-0" />
                        {agent.agency?.name ?? 'Independent'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={agent.verificationStatus === 'verified' ? 'success' : agent.verificationStatus === 'rejected' ? 'destructive' : 'warning'}
                  >
                    {agent.verificationStatus}
                  </Badge>
                </div>

                <div className="mt-4 flex-1 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {agent.city ?? '—'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {agent.phone ?? '—'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                    {agent.subscription?.tierName ?? 'No active plan'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 shrink-0" />
                    {agent.listingCounts.verified} / {agent.listingCounts.total} listings verified
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 items-center gap-2 border-t border-border pt-3">
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
                  <Button size="sm" variant="outline" className="" onClick={() => setCreditsModalAgent(agent)}>
                    <CreditCard className="mr-1 h-3.5 w-3.5" />
                    Credits
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

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
