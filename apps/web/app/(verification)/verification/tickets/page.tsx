'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SupportTicket, SupportTicketStatus, useAssignedSupportTicketsViewModel } from '@jayedaad/core';
import { Badge, Modal, Pagination, cn } from '@jayedaad/ui-web';
import { Eye, LifeBuoy } from 'lucide-react';
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

// verification_staff's own view of tickets Super Admin has assigned to
// them (GET /support/tickets/assigned) — read-only, same "no reply thread"
// scope as the rest of this help-desk system: working a ticket still
// happens through Super Admin's status/note update on /admin/support, this
// page exists so staff can see what's in their queue, not act on it here.
export default function AssignedTicketsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [page, setPage] = useState(1);
  const { tickets, total, isLoading } = useAssignedSupportTicketsViewModel({
    status: activeTab === 'all' ? undefined : activeTab,
    page,
    pageSize: PAGE_SIZE,
  });
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleTabChange(next: StatusTab) {
    setActiveTab(next);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LifeBuoy className="h-4 w-4" />
            Help desk
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">My Tickets</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span> {total === 1 ? 'ticket' : 'tickets'} assigned to you by Super
            Admin.
          </p>
        </div>
      </Reveal>

      <Reveal>
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
                  layoutId="assignedTicketsStatusTab"
                  className="bg-heading-gradient absolute inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>
      </Reveal>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <LifeBuoy className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No tickets here</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeTab === 'all' ? 'Tickets Super Admin assigns to you will appear here.' : `No ${STATUS_LABEL[activeTab as SupportTicketStatus].toLowerCase()} tickets.`}
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
                  <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingTicket(ticket)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={!!viewingTicket} onClose={() => setViewingTicket(null)} title={viewingTicket?.subject ?? ''}>
        {viewingTicket && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[viewingTicket.status]}>{STATUS_LABEL[viewingTicket.status]}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(viewingTicket.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{viewingTicket.message}</p>
            {viewingTicket.adminNote && (
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground/90">
                <span className="font-medium">Note:</span> {viewingTicket.adminNote}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
