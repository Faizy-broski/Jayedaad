'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LoggableActivityType, useActivityTimelineViewModel } from '@jayedaad/core';
import { Button, Label, Modal, Select, Textarea } from '@jayedaad/ui-web';

const TYPE_OPTIONS: { value: LoggableActivityType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
];

function nowLocalIso(): string {
  // Local-time datetime-local input value — same trim-seconds shape every
  // <input type="datetime-local"> expects.
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export interface LogActivityModalProps {
  open: boolean;
  onClose: () => void;
  leadId?: string;
  opportunityId?: string;
}

// Same modal-composition style as MarkDealModal.tsx (Modal + Label/Select/
// Textarea from @jayedaad/ui-web, one mutation, toast on settle).
export function LogActivityModal({ open, onClose, leadId, opportunityId }: LogActivityModalProps) {
  const { logActivity } = useActivityTimelineViewModel({ leadId, opportunityId });

  const [type, setType] = useState<LoggableActivityType>('call');
  const [occurredAt, setOccurredAt] = useState(nowLocalIso());
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState('');

  useEffect(() => {
    if (!open) return;
    setType('call');
    setOccurredAt(nowLocalIso());
    setSummary('');
    setOutcome('');
  }, [open]);

  function handleSubmit() {
    if (!summary.trim()) {
      toast.error('Enter a summary of what happened.');
      return;
    }
    logActivity.mutate(
      {
        type,
        occurredAt: new Date(occurredAt).toISOString(),
        summary: summary.trim(),
        outcome: outcome.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Activity logged.');
          onClose();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Activity" description="Record a call, email, WhatsApp message, or meeting.">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="activityType">Type</Label>
          <Select id="activityType" value={type} onChange={(e) => setType(e.target.value as LoggableActivityType)}>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activityOccurredAt">When</Label>
          <input
            id="activityOccurredAt"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activitySummary">Summary</Label>
          <Textarea id="activitySummary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What happened…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activityOutcome">Outcome (optional)</Label>
          <Textarea id="activityOutcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="e.g. Interested, will follow up next week" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={logActivity.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={logActivity.isPending}>
            {logActivity.isPending ? 'Saving…' : 'Log Activity'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
