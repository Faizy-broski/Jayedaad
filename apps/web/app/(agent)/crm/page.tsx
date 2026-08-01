'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useLeadInboxViewModel } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-web';
import {
  Inbox,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Send,
  ChevronDown,
  MessagesSquare,
  Globe,
  PhoneCall,
} from 'lucide-react';

type LeadStatusValue = 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost';

const STATUS_FILTERS: { id: LeadStatusValue | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'closed', label: 'Closed' },
  { id: 'lost', label: 'Lost' },
];

// Sample data for local UI testing — not exported: Next.js app-router page
// files may only export `default` and a small set of blessed names
// (metadata, etc.), so a named export here breaks the route's generated type.
const MOCK_LEADS = [
  {
    id: '1',
    name: 'Ahmed Raza',
    status: 'new',
    source: 'contact_form',
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(), // 5m ago
    message: 'Interested in the 5-marla plot in DHA Phase 6. Is it still available?',
    phone: '+92 300 1234567',
    email: 'ahmed.raza@example.com',
  },
  {
    id: '2',
    name: 'Sana Malik',
    status: 'contacted',
    source: 'chatbot',
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(), // 2h ago
    message: 'Can you share more photos of the Bahria Town villa listing?',
    phone: '+92 321 9876543',
    email: 'sana.malik@example.com',
  },
  {
    id: '3',
    name: 'Bilal Khan',
    status: 'negotiating',
    source: 'call_request',
    createdAt: new Date(Date.now() - 26 * 60 * 60_000).toISOString(), // 1d+ ago
    message: 'Offering 2.1 crore for the Gulberg property, open to counter.',
    phone: '+92 333 4567890',
    email: 'bilal.khan@example.com',
  },
  {
    id: '4',
    name: 'Fatima Sheikh',
    status: 'closed',
    source: 'contact_form',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60_000).toISOString(),
    message: 'Deal finalized on the Askari 10 apartment. Thank you!',
    phone: '+92 345 1122334',
    email: 'fatima.sheikh@example.com',
  },
  {
    id: '5',
    name: 'Usman Tariq',
    status: 'lost',
    source: 'chatbot',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60_000).toISOString(),
    message: 'Went with another agency, budget mismatch.',
    phone: '+92 302 5556677',
    email: 'usman.tariq@example.com',
  },
  {
    id: '6',
    name: 'Ayesha Noor',
    status: 'new',
    source: 'call_request',
    createdAt: new Date(Date.now() - 40 * 60_000).toISOString(), // 40m ago
    message: '',
    phone: '+92 311 8899001',
    email: 'ayesha.noor@example.com',
  },
] as const;

const STATUS_STYLES: Record<LeadStatusValue, { dot: string; badge: string }> = {
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

// Shape the list actually reads from — real Lead objects (from
// useLeadInboxViewModel) are a superset of this, so both that and
// MOCK_LEADS satisfy it below.
type LeadLike = {
  id: string;
  name: string;
  status: LeadStatusValue;
  source: string;
  createdAt: string;
  message: string;
  phone: string;
  email: string;
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

// Agent/J.Team CRM inbox — daily-driver screen [Dev Instr §1]. Scoping (agent
// sees own leads, J.Team sees all) is enforced server-side by the API, not
// here. Card-list layout (not the old table) with framer-motion — already a
// dependency (see apps/web/package.json), used elsewhere for reveal
// animations — for the filter pill's sliding indicator and staggered
// list enter/exit as leads move between status filters.
export default function CrmPage() {
  const { leads: realLeads, isLoading, updateStatus, addNote } = useLeadInboxViewModel({});
  // Falls back to MOCK_LEADS whenever the real inbox is empty — lets this
  // page be reviewed/tested with a populated list before there's real lead
  // data to look at. Remove once the CRM has genuine traffic to rely on.
  const leads: LeadLike[] = useMemo(
    () => (!isLoading && realLeads.length === 0 ? [...MOCK_LEADS] : realLeads),
    [isLoading, realLeads],
  );
  const [statusFilter, setStatusFilter] = useState<LeadStatusValue | 'all'>('all');
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const filteredLeads = useMemo(
    () => (statusFilter === 'all' ? leads : leads.filter((l) => l.status === statusFilter)),
    [leads, statusFilter],
  );

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

  function changeStatus(leadId: string, status: LeadStatusValue) {
    updateStatus.mutate(
      { leadId, status },
      {
        onSuccess: () => toast.success(`Lead marked as ${status}.`),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inquiry Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {leads.length} total inquiries · {leads.filter((l) => l.status === 'new').length} new
        </p>
      </div>

      {/* Status filter pills — motion.span with a shared layoutId slides
          smoothly between whichever pill is active instead of snapping. */}
      <div className="flex flex-wrap gap-1 rounded-full border border-border bg-muted/40 p-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
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

      {!isLoading && filteredLeads.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center"
        >
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">No inquiries here</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {statusFilter === 'all' ? 'New inquiries will show up here.' : `No ${statusFilter} inquiries right now.`}
          </p>
        </motion.div>
      )}

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {filteredLeads.map((lead, index) => {
            const style = STATUS_STYLES[lead.status as LeadStatusValue] ?? STATUS_STYLES.new;
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

                  <div className="relative shrink-0">
                    <select
                      value={lead.status}
                      onChange={(e) => changeStatus(lead.id, e.target.value as LeadStatusValue)}
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
                </div>

                {lead.message && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{lead.message}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {lead.phone}
                  </a>
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {lead.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => setOpenNoteFor(noteOpen ? null : lead.id)}
                    className="ml-auto flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {noteOpen ? 'Cancel' : 'Add note'}
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
                      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
