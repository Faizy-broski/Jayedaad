'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Lead, LeadStatus, resolveAgentDisplayName, useAdminAgentsViewModel, useAdminCrmStatsViewModel, useAdminCrmViewModel } from '@jayedaad/core';
import { Button, cn, Input, Pagination } from '@jayedaad/ui-web';
import {
  AlertTriangle,
  Building2,
  Clock,
  ExternalLink,
  Globe,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Phone,
  PhoneCall,
  Search,
  UserCog,
  Users,
  UserX,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { SetReminderPopover } from '@/components/crm/SetReminderPopover';
import { AgentAgencyPicker, PickerSelection } from '@/components/crm/AgentAgencyPicker';
import { EntityDetailPanel } from '@/components/crm/EntityDetailPanel';

const PAGE_SIZE = 20;

const STATUS_FILTERS: { id: LeadStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'closed', label: 'Closed' },
  { id: 'lost', label: 'Lost' },
];

const STATUS_STYLES: Record<LeadStatus, { dot: string; badge: string }> = {
  new: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  contacted: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  negotiating: { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
  closed: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary' },
  lost: { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

const SOURCE_ICON: Record<string, typeof Globe> = {
  chatbot: MessagesSquare,
  contact_form: Globe,
  call_request: PhoneCall,
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function whatsappHref(phone: string, name: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hi ${name}, `)}`;
}

// Super Admin cross-agent CRM — same GET /crm/leads endpoint the agent
// Inbox uses, unscoped, restyled to match the card-list/animation language
// of the agent CRM inbox, with an agent filter/attribution/reassign layered
// on since rows are no longer implicitly scoped to one agent.
export default function AdminCrmPage() {
  const { agents } = useAdminAgentsViewModel();
  const [pickerSelection, setPickerSelection] = useState<PickerSelection>(null);
  // Agency selections open the details panel only (per product decision) —
  // the lead list stays unfiltered unless an individual agent is picked.
  const agentFilter = pickerSelection?.type === 'agent' ? pickerSelection.id : '';
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);

  const { leads, total, isLoading, isError, refetch } = useAdminCrmViewModel({
    agentId: agentFilter || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const stats = useAdminCrmStatsViewModel(agentFilter || undefined);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const agentName = (id: string | null) => (id ? resolveAgentDisplayName(agents.find((a) => a.id === id)) : 'Unassigned');

  function handleTabChange(next: LeadStatus | 'all') {
    setStatusFilter(next);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Inbox className="h-4 w-4" />
              CRM — all agents
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Leads</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.total}</span> total inquiries —{' '}
              <span className="font-semibold text-foreground">{stats.new}</span> new.
            </p>
          </div>

          <AgentAgencyPicker
            value={pickerSelection}
            onSelect={(selection) => {
              setPickerSelection(selection);
              setPage(1);
            }}
          />
        </div>
      </Reveal>

      <EntityDetailPanel
        selection={pickerSelection}
        onClose={() => {
          setPickerSelection(null);
          setPage(1);
        }}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />)
        ) : (
          <>
            <StatTile index={0} icon={Inbox} label="Total Leads" value={stats.total} sub="All inquiries" />
            <StatTile index={1} icon={MessageSquare} label="New" value={stats.new} sub="Not yet contacted" />
            <StatTile index={2} icon={UserX} label="Unassigned" value={stats.unassigned} sub="Needs an agent" />
            <StatTile index={3} icon={Users} label="Closed" value={stats.closed} sub="Deals won" />
          </>
        )}
      </div>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleTabChange(f.id)}
                className={cn(
                  'relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  statusFilter === f.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {statusFilter === f.id && (
                  <motion.span
                    layoutId="adminCrmStatusPill"
                    className="bg-heading-gradient absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search name, phone, email…" className="pl-9" />
          </div>
        </div>
      </Reveal>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Couldn&apos;t load leads</h3>
            <p className="mt-1 text-xs text-muted-foreground">Something went wrong fetching the CRM.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && leads.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center"
        >
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">No leads here</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {search ? 'Try a different search.' : statusFilter === 'all' ? 'New inquiries will show up here.' : `No ${statusFilter} inquiries right now.`}
          </p>
        </motion.div>
      )}

      {!isLoading && !isError && leads.length > 0 && (
        <>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {leads.map((lead: Lead, index) => {
                const style = STATUS_STYLES[lead.status];
                const SourceIcon = SOURCE_ICON[lead.source] ?? Globe;
                const noteOpen = openNoteFor === lead.id;

                return (
                  <motion.li
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.25, delay: Math.min(index, 6) * 0.04 }}
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {lead.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">{lead.name}</p>
                            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', style.badge)}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
                              {lead.status}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {relativeTime(lead.createdAt)}
                            </span>
                            <span className="flex items-center gap-1 capitalize">
                              <SourceIcon className="h-3 w-3" />
                              {lead.source.replace('_', ' ')}
                            </span>
                            <span className={cn('flex items-center gap-1', !lead.agentId && 'font-medium text-amber-600 dark:text-amber-400')}>
                              <UserCog className="h-3 w-3" />
                              {agentName(lead.agentId)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {lead.message && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{lead.message}</p>}

                    {/* Exactly one of listingId/projectId is ever set (DB
                        constraint — see the Lead model comment) — admin
                        detail pages, not the public ones, since Super Admin
                        needs access regardless of verification status. */}
                    {(lead.listingId || lead.projectId) && (
                      <Link
                        href={lead.listingId ? `/admin/listings/${lead.listingId}` : `/admin/projects/${lead.projectId}`}
                        target="_blank"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        View {lead.listingId ? 'listing' : 'project'}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </a>
                      <a
                        href={whatsappHref(lead.phone, lead.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {lead.email}
                      </a>
                      <SetReminderPopover leadId={lead.id} />
                      <button
                        type="button"
                        onClick={() => setOpenNoteFor(noteOpen ? null : lead.id)}
                        className="ml-auto flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {noteOpen ? 'Close notes' : `Notes${lead.notes.length ? ` (${lead.notes.length})` : ''}`}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {noteOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2 border-t border-border pt-3">
                            {lead.notes.length > 0 ? (
                              <ul className="space-y-1.5">
                                {lead.notes.map((note) => (
                                  <li key={note.id} className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground/90">
                                    <p>{note.body}</p>
                                    <p className="mt-0.5 text-[10px] text-muted-foreground">{relativeTime(note.createdAt)}</p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground">No notes on this lead yet.</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
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
  icon: typeof Inbox;
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
