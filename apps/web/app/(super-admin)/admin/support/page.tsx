'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { SupportTicket, SupportTicketStatus, useAdminSupportViewModel, useUserManagementViewModel } from '@jayedaad/core';
import { Badge, Button, cn, ConfirmDialog, Input, Label, Modal, Pagination, Select } from '@jayedaad/ui-web';
import { CheckCircle2, Clock, Eye, LifeBuoy, Loader2, Trash2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const PAGE_SIZE = 20;

type StatusTab = 'all' | SupportTicketStatus;

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
];

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const STATUS_VARIANT: Record<SupportTicketStatus, 'warning' | 'default' | 'success'> = {
  open: 'warning',
  in_progress: 'default',
  resolved: 'success',
};

// Super Admin side of the agent-facing help desk (apps/web (agent)/help) —
// status-only lifecycle, no reply thread, per the confirmed scope. Every
// new ticket also triggers a bell notification (NotificationBell.tsx routes
// 'support_ticket' notifications here).
export default function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>(''); // '' = all staff/unassigned
  const [page, setPage] = useState(1);
  const { tickets, total, isLoading, updateStatus, remove, assign } = useAdminSupportViewModel({
    status: activeTab === 'all' ? undefined : activeTab,
    assignedTo: assignedFilter || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  // Unfiltered roster to resolve created_by -> a real name, same pattern
  // Verification Log uses for reviewerId -> name. Also doubles as the
  // eligible-assignee list (filtered to verification_staff client-side)
  // rather than a second fetch — this roster already has every user.
  const { users } = useUserManagementViewModel();
  const staff = users.filter((u) => u.role === 'verification_staff');
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [statusForm, setStatusForm] = useState<SupportTicketStatus>('open');
  const [noteForm, setNoteForm] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const submitterName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user?.displayName ?? user?.email ?? id;
  };

  const staffName = (id: string | null) => {
    if (!id) return null;
    const user = users.find((u) => u.id === id);
    return user?.displayName ?? user?.email ?? id;
  };

  function handleAssign(ticketId: string, staffId: string) {
    if (!staffId) return;
    assign.mutate(
      { id: ticketId, staffId },
      {
        onSuccess: () => toast.success('Ticket assigned.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleTabChange(next: StatusTab) {
    setActiveTab(next);
    setPage(1);
  }

  function openEdit(ticket: SupportTicket) {
    setEditingTicket(ticket);
    setStatusForm(ticket.status);
    setNoteForm(ticket.adminNote ?? '');
  }

  function handleSaveStatus() {
    if (!editingTicket) return;
    updateStatus.mutate(
      { id: editingTicket.id, input: { status: statusForm, adminNote: noteForm.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success('Ticket updated.');
          setEditingTicket(null);
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
      onSuccess: () => toast.success('Ticket deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LifeBuoy className="h-4 w-4" />
            Help desk
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Support</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span> {total === 1 ? 'issue' : 'issues'} submitted by agents.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
            {STATUS_TABS.map((tab) => (
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
                    layoutId="supportStatusTab"
                    className="bg-heading-gradient absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Filters the list down to one staff member's queue — the "see
              the status of tickets assigned" half of the feature. Left at
              the default ('' = every ticket regardless of assignment) so
              this doesn't change today's behavior unless explicitly used. */}
          {staff.length > 0 && (
            <div className="w-48">
              <Select
                value={assignedFilter}
                onChange={(e) => {
                  setAssignedFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All assignees</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName ?? s.email}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </Reveal>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <LifeBuoy className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No tickets here</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeTab === 'all' ? 'Issues agents submit will appear here.' : `No ${STATUS_LABEL[activeTab as SupportTicketStatus].toLowerCase()} tickets.`}
            </p>
          </div>
        </Reveal>
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
                    <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    From {submitterName(ticket.createdBy)} ·{' '}
                    {new Date(ticket.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {ticket.assignedTo && (
                      <>
                        {' '}
                        · Assigned to <span className="font-medium text-foreground">{staffName(ticket.assignedTo)}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {staff.length > 0 && (
                    <select
                      value={ticket.assignedTo ?? ''}
                      onChange={(e) => handleAssign(ticket.id, e.target.value)}
                      disabled={assign.isPending}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    >
                      <option value="" disabled>
                        Assign to…
                      </option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.displayName ?? s.email}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setViewingTicket(ticket)}>
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(ticket)}>
                    {ticket.status === 'resolved' ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Clock className="mr-1 h-3.5 w-3.5" />}
                    Update
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTargetId(ticket.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Full issue text lives here, not on the card — the list stays
          scannable (subject/status/submitter only), same "card summary,
          modal for detail" convention as everywhere else in admin. */}
      <Modal open={!!viewingTicket} onClose={() => setViewingTicket(null)} title={viewingTicket?.subject ?? ''}>
        {viewingTicket && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[viewingTicket.status]}>{STATUS_LABEL[viewingTicket.status]}</Badge>
              <span className="text-xs text-muted-foreground">
                From {submitterName(viewingTicket.createdBy)} ·{' '}
                {new Date(viewingTicket.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                {viewingTicket.assignedTo && <> · Assigned to {staffName(viewingTicket.assignedTo)}</>}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{viewingTicket.message}</p>
            {viewingTicket.adminNote && (
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground/90">
                <span className="font-medium">Note:</span> {viewingTicket.adminNote}
              </p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                openEdit(viewingTicket);
                setViewingTicket(null);
              }}
            >
              {viewingTicket.status === 'resolved' ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : <Clock className="mr-1.5 h-3.5 w-3.5" />}
              Update status
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={!!editingTicket} onClose={() => setEditingTicket(null)} title={`Update — ${editingTicket?.subject ?? ''}`}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={statusForm} onChange={(e) => setStatusForm(e.target.value as SupportTicketStatus)}>
              {(Object.keys(STATUS_LABEL) as SupportTicketStatus[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Note (visible to the agent)</Label>
            <Input value={noteForm} onChange={(e) => setNoteForm(e.target.value)} placeholder="Optional — how it was resolved, next steps…" />
          </div>
          <Button onClick={handleSaveStatus} disabled={updateStatus.isPending} className="w-full">
            {updateStatus.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTargetId}
        message="Delete this ticket? This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
