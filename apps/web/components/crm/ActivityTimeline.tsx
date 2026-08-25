'use client';

import { useActivityTimelineViewModel } from '@jayedaad/core';
import { AlertTriangle, Mail, MessageCircle, MessagesSquare, PhoneCall } from 'lucide-react';
import { relativeTime } from '@/lib/relativeTime';

const TYPE_ICON = {
  call: PhoneCall,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: MessagesSquare,
} as const;

const TYPE_LABEL: Record<keyof typeof TYPE_ICON, string> = {
  call: 'Call',
  email: 'Email',
  whatsapp: 'WhatsApp',
  meeting: 'Meeting',
};

// Real interaction history — calls/emails/whatsapp/meetings logged against
// a lead or an opportunity (Phase 2 of the CRM maturity build-out). First
// time either surface gets any rendered activity timeline — the
// lead_activity/opportunity_activity data existed structurally before this,
// nothing ever rendered it.
export function ActivityTimeline({ leadId, opportunityId }: { leadId?: string; opportunityId?: string }) {
  const { activity, isLoading, isError } = useActivityTimelineViewModel({ leadId, opportunityId });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    );
  }

  // Previously unread — a failed fetch resolved `activity` to [] and this
  // fell straight into the empty-state branch below, reading as "no
  // activity" when the real story was "couldn't load it."
  if (isError) {
    return (
      <p className="flex items-center justify-center gap-1.5 py-4 text-center text-xs text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" />
        Couldn&apos;t load activity — please try again.
      </p>
    );
  }

  if (activity.length === 0) {
    return <p className="py-4 text-center text-xs text-muted-foreground">No activity logged yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {activity.map((entry) => {
        const Icon = TYPE_ICON[entry.type as keyof typeof TYPE_ICON] ?? MessagesSquare;
        return (
          <li key={entry.id} className="flex items-start gap-2.5 rounded-lg bg-muted/40 px-3 py-2">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{TYPE_LABEL[entry.type as keyof typeof TYPE_ICON] ?? entry.type}</span>
                <span className="text-[10px] text-muted-foreground">{relativeTime(entry.occurredAt)}</span>
              </div>
              <p className="mt-0.5 text-xs text-foreground/90">{entry.summary}</p>
              {entry.outcome && <p className="mt-0.5 text-[11px] italic text-muted-foreground">Outcome: {entry.outcome}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
