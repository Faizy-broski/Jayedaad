'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Lead, LeadStatus, useAgentProfileViewModel, useLeadInboxViewModel } from '@jayedaad/core';
import { Button, Input, Select } from '@jayedaad/ui-web';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Clock,
  Send,
  MessagesSquare,
  Globe,
  PhoneCall,
  Search,
  Building2,
  ExternalLink,
} from 'lucide-react';
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
  new: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
  contacted: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
  negotiating: { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700' },
  closed: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary' },
  lost: { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
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
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hi ${name}, thanks for your enquiry on Jayedaad — `)}`;
}

// Agent/J.Team CRM inbox — daily-driver screen [Dev Instr §1]. Scoping (agent
// sees own leads, J.Team sees all) is enforced server-side by the API, not
// here. Card-list layout (not the old table) with framer-motion — already a
// dependency (see apps/web/package.json), used elsewhere for reveal
// animations — for the filter pill's sliding indicator and staggered
// list enter/exit as leads move between status filters.
export default function CrmPage() {
  const { profile } = useAgentProfileViewModel();
  const [agencyScope, setAgencyScope] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const { leads, total, isLoading, isError, refetch, updateStatus, addNote } = useLeadInboxViewModel({
    scope: agencyScope ? 'agency' : 'own',
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const visibleLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q),
    );
  }, [leads, search]);

  function handleTabChange(next: LeadStatus | 'all') {
    setStatusFilter(next);
    setPage(1);
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

  function changeStatus(leadId: string, status: LeadStatus) {
    updateStatus.mutate(
      { leadId, status },
      {
        onSuccess: () => toast.success(`Lead marked as ${status}.`),
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inquiry Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} total inquiries</p>
        </div>
        {profile?.isAgencyAdmin && (
          <button
            type="button"
            onClick={() => {
              setAgencyScope((v) => !v);
              setPage(1);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              agencyScope ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-muted-foreground hover:text-foreground'
            }`}
          >
            {agencyScope ? 'Showing: Whole Agency' : 'Show Whole Agency'}
          </button>
        )}
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email…" className="pl-9" />
      </div>

      {/* Status filter pills — motion.span with a shared layoutId slides
          smoothly between whichever pill is active instead of snapping. */}
      <div className="flex flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleTabChange(f.id)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {statusFilter === f.id && (
              <motion.span
                layoutId="activeStatusPill"
                className="bg-heading-gradient absolute inset-0 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">{f.label}</span>
          </button>
        ))}
      </div>

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
            <h3 className="text-sm font-semibold text-foreground">Couldn&apos;t load your inbox</h3>
            <p className="mt-1 text-xs text-muted-foreground">Something went wrong fetching your leads.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && visibleLeads.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center"
        >
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">No inquiries here</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? 'Try a different search.'
              : statusFilter === 'all'
                ? 'New inquiries will show up here.'
                : `No ${statusFilter} inquiries right now.`}
          </p>
        </motion.div>
      )}

      {!isLoading && !isError && visibleLeads.length > 0 && (
        <>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {visibleLeads.map((lead: Lead, index) => {
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
                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${style.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
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
                          </div>
                        </div>
                      </div>

                      <Select
                        value={lead.status}
                        onChange={(e) => changeStatus(lead.id, e.target.value as LeadStatus)}
                        disabled={updateStatus.isPending}
                        className="h-7 w-auto shrink-0 rounded-full px-3 text-xs capitalize"
                      >
                        {STATUS_FILTERS.filter((f) => f.id !== 'all').map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {lead.message && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{lead.message}</p>}

                    {/* Exactly one of listingId/projectId is ever set (DB
                        constraint — see the Lead model comment) — jumps
                        straight to the actual listing/project this enquiry
                        is about instead of leaving the agent to guess from
                        the free-text message alone. */}
                    {(lead.listingId || lead.projectId) && (
                      <Link
                        href={lead.listingId ? `/listings/${lead.listingId}` : `/projects/${lead.projectId}`}
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
                              <Button
                                size="sm"
                                disabled={!draftNotes[lead.id]?.trim() || addNote.isPending}
                                onClick={() => submitNote(lead.id)}
                              >
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
