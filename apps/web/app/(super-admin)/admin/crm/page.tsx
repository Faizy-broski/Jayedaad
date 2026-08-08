'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lead, LeadStatus, useAdminAgentsViewModel, useAdminCrmStatsViewModel, useAdminCrmViewModel } from '@jayedaad/core';
import { Button, cn, Input, Pagination } from '@jayedaad/ui-web';
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Globe,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Phone,
  PhoneCall,
  Search,
  Send,
  Trash2,
  UserCog,
  Users,
  UserX,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { SetReminderPopover } from '@/components/crm/SetReminderPopover';

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
  const [agentFilter, setAgentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const { leads, total, isLoading, isError, refetch, updateStatus, addNote, assign, remove } = useAdminCrmViewModel({
    agentId: agentFilter || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const stats = useAdminCrmStatsViewModel(agentFilter || undefined);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const agentName = (id: string | null) => (id ? (agents.find((a) => a.id === id)?.displayName ?? id) : 'Unassigned');

  function handleTabChange(next: LeadStatus | 'all') {
    setStatusFilter(next);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeStatus(leadId: string, status: LeadStatus) {
    updateStatus.mutate(
      { leadId, status },
      {
        onSuccess: () => toast.success(`Lead marked as ${status}.`),
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

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

  function handleDelete(leadId: string, name: string) {
    if (!confirm(`Delete the lead from "${name}"? This cannot be undone.`)) return;
    remove.mutate(leadId, {
      onSuccess: () => toast.success('Lead deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  function submitNote(leadId: string) {
    const body = draftNotes[leadId]?.trim();
    if (!body) return;
    addNote.mutate(
      { leadId, body },
      {
        onSuccess: () => {
          toast.success('Note added.');
          setDraftNotes((prev) => ({ ...prev, [leadId]: '' }));
          setOpenNoteFor(null);
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
              <Inbox className="h-4 w-4" />
              CRM — all agents
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Leads</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.total}</span> total inquiries —{' '}
              <span className="font-semibold text-foreground">{stats.new}</span> new.
            </p>
          </div>

          <div className="relative w-full max-w-xs">
            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full appearance-none rounded-full border border-input bg-background px-4 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName ?? a.id}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </Reveal>

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

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <div className="relative">
                          <select
                            value={lead.status}
                            onChange={(e) => changeStatus(lead.id, e.target.value as LeadStatus)}
                            disabled={updateStatus.isPending}
                            className="appearance-none rounded-full border border-input bg-background py-1.5 pl-3 pr-8 text-xs font-medium capitalize text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                          >
                            {STATUS_FILTERS.filter((f) => f.id !== 'all').map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        </div>

                        <div className="relative">
                          <select
                            value=""
                            onChange={(e) => handleReassign(lead.id, e.target.value)}
                            disabled={assign.isPending}
                            className="appearance-none rounded-full border border-input bg-background py-1.5 pl-3 pr-8 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                          >
                            <option value="">Reassign to…</option>
                            {agents
                              .filter((a) => a.id !== lead.agentId)
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.displayName ?? a.id}
                                </option>
                              ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          disabled={remove.isPending}
                          onClick={() => handleDelete(lead.id, lead.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {lead.message && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{lead.message}</p>}

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
                            {lead.notes.length > 0 && (
                              <ul className="space-y-1.5">
                                {lead.notes.map((note) => (
                                  <li key={note.id} className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground/90">
                                    <p>{note.body}</p>
                                    <p className="mt-0.5 text-[10px] text-muted-foreground">{relativeTime(note.createdAt)}</p>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                type="text"
                                value={draftNotes[lead.id] ?? ''}
                                onChange={(e) => setDraftNotes((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && submitNote(lead.id)}
                                placeholder="Add a note…"
                                className="h-9 flex-1 rounded-full border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              />
                              <Button size="sm" disabled={!draftNotes[lead.id]?.trim() || addNote.isPending} onClick={() => submitNote(lead.id)}>
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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
