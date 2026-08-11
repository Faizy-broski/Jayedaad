'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { SupportTicket, useSupportTicketsViewModel } from '@jayedaad/core';
import { Badge, Button, Card, ConfirmDialog, Input, Label, Pagination } from '@jayedaad/ui-web';
import { Clock, LifeBuoy, Mail, MapPin, MessageCircle, Pencil, Phone, Send, Trash2, X } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const PAGE_SIZE = 10;

// Same real contact details already shown on the public /contact-us page
// (components/contact-us/OfficeShowCase.tsx) — mirrored here, not
// reinvented, for the agent-dashboard-facing "who to contact" card.
const CONTACT_ROWS: { icon: typeof MapPin; label: string; value: string; href?: string }[] = [
  { icon: MapPin, label: 'Address', value: 'Jayedaad House, 12-A Main Boulevard, Gulberg III, Lahore' },
  { icon: Clock, label: 'Hours', value: 'Mon–Sat · 9:00 – 20:00' },
  { icon: Phone, label: 'Phone', value: '+92 42 111 000 111', href: 'tel:+9242111000111' },
  { icon: Mail, label: 'Email', value: 'hello@jayedaad.com', href: 'mailto:hello@jayedaad.com' },
  { icon: MessageCircle, label: 'WhatsApp', value: '+92 300 000 0000', href: 'https://wa.me/923000000000' },
];

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const STATUS_VARIANT: Record<string, 'warning' | 'default' | 'success'> = {
  open: 'warning',
  in_progress: 'default',
  resolved: 'success',
};

// Agent-facing help desk — contact details for reaching the Jayedaad team
// directly, plus a form to submit an issue that lands with Super Admin
// (notified via the bell, see NotificationBell.tsx) and gets tracked here
// by status. No reply thread — status-only, per the confirmed scope.
export default function HelpPage() {
  const [page, setPage] = useState(1);
  const { tickets, total, isLoading, submit, update, remove } = useSupportTicketsViewModel({ page, pageSize: PAGE_SIZE });
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  // Editing an existing (still-open) ticket reuses the same form, in place
  // of a separate modal — Save calls update() instead of submit() while set.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function startEdit(ticket: SupportTicket) {
    setEditingId(ticket.id);
    setSubject(ticket.subject);
    setMessage(ticket.message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setSubject('');
    setMessage('');
  }

  function handleSubmit() {
    if (!subject.trim() || !message.trim()) return;

    if (editingId) {
      update.mutate(
        { id: editingId, input: { subject: subject.trim(), message: message.trim() } },
        {
          onSuccess: () => {
            toast.success('Ticket updated.');
            cancelEdit();
          },
          onError: () => toast.error('Something went wrong — please try again.'),
        },
      );
      return;
    }

    submit.mutate(
      { subject: subject.trim(), message: message.trim() },
      {
        onSuccess: () => {
          toast.success('Your issue has been sent to the Jayedaad team.');
          setSubject('');
          setMessage('');
          setPage(1);
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    remove.mutate(id, {
      onSuccess: () => {
        toast.success('Ticket deleted.');
        if (editingId === id) cancelEdit();
      },
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LifeBuoy className="h-4 w-4" />
            Help &amp; Support
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Need a hand?</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Reach the Jayedaad team directly, or send us an issue and we&apos;ll follow up here.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Reveal className="lg:col-span-2">
          <Card className="space-y-5 p-5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Head office</span>
              <h2 className="mt-1 text-lg font-bold text-heading-gradient">Jayedaad House, Lahore</h2>
            </div>
            <dl className="space-y-4">
              {CONTACT_ROWS.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">
                      {href ? (
                        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="hover:text-primary">
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </Card>
        </Reveal>

        <Reveal className="lg:col-span-3">
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit issue' : 'Submit an issue'}</h2>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe the issue — the more detail, the faster we can help."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button onClick={handleSubmit} disabled={submit.isPending || update.isPending || !subject.trim() || !message.trim()}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {editingId ? (update.isPending ? 'Saving…' : 'Save changes') : submit.isPending ? 'Sending…' : 'Send to Jayedaad team'}
            </Button>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Your submitted issues</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted/40" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
              <LifeBuoy className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-sm font-semibold text-foreground">Nothing submitted yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">Issues you send us will show up here with their status.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tickets.map((ticket, index) => (
                <motion.li
                  key={ticket.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
                  className="rounded-xl border border-border bg-background p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
                      <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
                    </div>
                    {/* Only while still 'open' — once Super Admin has acted
                        on it, the submitter can no longer change it (server
                        also enforces this, see support.repository.ts::
                        assertOwnOpenTicket). */}
                    {ticket.status === 'open' && (
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(ticket)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTargetId(ticket.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{ticket.message}</p>
                  {ticket.adminNote && (
                    <p className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground/90">
                      <span className="font-medium">Jayedaad team:</span> {ticket.adminNote}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTargetId}
        message="Delete this ticket? This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
