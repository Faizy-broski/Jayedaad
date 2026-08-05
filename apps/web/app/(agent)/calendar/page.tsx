'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Appointment, AppointmentStatus, useAppointmentsViewModel } from '@jayedaad/core';
import { Button, Input, Label, Modal } from '@jayedaad/ui-web';
import { CalendarDays, Plus } from 'lucide-react';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  requested: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-primary/10 text-primary',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-50 text-red-700',
};

function formatSectionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Agenda-style calendar backing the Sales Associate "calendar" bullet —
// mirrors apps/mobile's CalendarScreen.tsx. Appointments come either from
// "Book a Visit" on a listing (status 'requested') or created here manually.
export default function CalendarPage() {
  const { appointments, isLoading, create, update, remove } = useAppointmentsViewModel();
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const sections = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const key = new Date(appt.scheduledAt).toDateString();
      groups.set(key, [...(groups.get(key) ?? []), appt]);
    }
    return Array.from(groups.entries());
  }, [appointments]);

  function handleCreate() {
    if (!title || !scheduledAt) {
      toast.error('Enter a title and date/time.');
      return;
    }
    create.mutate(
      { title, scheduledAt: new Date(scheduledAt).toISOString(), status: 'confirmed' },
      {
        onSuccess: () => {
          toast.success('Appointment created.');
          setFormOpen(false);
          setTitle('');
          setScheduledAt('');
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function setStatus(appointmentId: string, status: AppointmentStatus) {
    update.mutate(
      { appointmentId, input: { status } },
      {
        onSuccess: () => toast.success(`Marked ${STATUS_LABEL[status].toLowerCase()}.`),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleRemove(appointmentId: string) {
    remove.mutate(appointmentId, {
      onSuccess: () => toast.success('Appointment removed.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visit requests and appointments</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {isLoading && <div className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />}

      {!isLoading && sections.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
          <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">No appointments yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">Book a Visit requests and manual appointments will show up here.</p>
        </div>
      )}

      <div className="space-y-6">
        {sections.map(([key, items]) => (
          <div key={key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {formatSectionDate(items[0].scheduledAt)}
            </p>
            <ul className="space-y-2">
              {items.map((appt) => (
                <li key={appt.id} className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{appt.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[appt.status]}`}>
                          {STATUS_LABEL[appt.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatTime(appt.scheduledAt)}</p>
                      {appt.notes && <p className="mt-2 text-sm text-foreground/90">{appt.notes}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {appt.status === 'requested' && (
                        <Button size="sm" variant="outline" onClick={() => setStatus(appt.id, 'confirmed')}>
                          Confirm
                        </Button>
                      )}
                      {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                        <Button size="sm" variant="outline" onClick={() => setStatus(appt.id, 'completed')}>
                          Complete
                        </Button>
                      )}
                      {appt.status !== 'cancelled' && (
                        <Button size="sm" variant="outline" onClick={() => setStatus(appt.id, 'cancelled')}>
                          Cancel
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleRemove(appt.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="New Appointment">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Property viewing" />
          </div>
          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <Button onClick={handleCreate} disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
