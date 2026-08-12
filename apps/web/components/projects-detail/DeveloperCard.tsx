'use client';

import Image from 'next/image';
import { BadgeCheck, Mail, MessageSquare, PhoneCall } from 'lucide-react';
import { projectsRepository } from '@jayedaad/core';
import { EnquiryDialog } from '@/components/shared/EnquiryDialog';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { getViewerSessionId } from '@/lib/viewerSession';
import type { DisplayProject } from '@/lib/types';

interface DeveloperCardProps {
  developer: DisplayProject['developer'];
  projectId: string;
  projectTitle: string;
  /** Lets ProjectDetail's top "Schedule site visit" button drive this same
   *  always-visible form (switches it to the visit template) instead of
   *  duplicating a second form near the top of the page. Defaults to
   *  'inquiry' when omitted. onIntentChange is accepted for API parity with
   *  that controlled usage but isn't called from within this card anymore
   *  — its own quick-action that used to reset back to 'inquiry' was
   *  replaced by the real Email mailto: below (see the comment on the
   *  quick-actions row). */
  intent?: 'inquiry' | 'visit';
  onIntentChange?: (intent: 'inquiry' | 'visit') => void;
}

export function DeveloperCard({ developer, projectId, projectTitle, intent = 'inquiry' }: DeveloperCardProps) {
  // Fire-and-forget — feeds project-level Calls/WhatsApp/SMS/Emails
  // analytics (see packages/core's projectsRepository.trackEngagement);
  // never blocks the real tel:/wa.me/sms:/mailto: action.
  function track(type: 'call' | 'whatsapp' | 'sms' | 'email') {
    projectsRepository
      .trackEngagement(projectId, { type, platform: 'web', viewerSessionId: getViewerSessionId() })
      .catch(() => {});
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100">
          <Image src={developer.logoUrl} alt={developer.name} fill sizes="44px" className="object-contain p-1.5" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-slate-900">{developer.name}</span>
          <span className="truncate text-xs text-slate-500">{developer.city}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified developer
      </div>

      <p className="text-xs leading-relaxed text-slate-500">{developer.description}</p>

      <EnquiryDialog intent={intent} target={{ type: 'project', id: projectId, title: projectTitle }} />

      {/* Quick links above the tracked form — Call/WhatsApp stay direct
          tel:/wa.me. This row used to have a second "Send Enquiry" button
          too, which just duplicated the form already visible right above —
          replaced with a real mailto: (developers.email, see
          0045_developer_email.sql). Always shown (not conditional on
          having an email set) for a consistent layout with AgentCard.tsx —
          a developer without one yet just gets a mailto: with no
          pre-filled recipient rather than the button disappearing. WhatsApp
          uses the real brand mark/green, not a generic message icon. */}
      <div className="flex flex-col gap-2">
        <a
          href={`tel:${developer.phone}`}
          onClick={() => track('call')}
          className="flex items-center justify-center gap-2 rounded-full bg-heading-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <PhoneCall className="h-4 w-4" />
          Call developer
        </a>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${developer.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp')}
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#25D366] px-4 py-2.5 text-sm font-bold text-[#25D366] transition-colors hover:bg-[#25D366]/5"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
            WhatsApp
          </a>
          <a
            href={`sms:${developer.phone}`}
            onClick={() => track('sms')}
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-primary px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            SMS
          </a>
          <a
            href={`mailto:${developer.email ?? ''}`}
            onClick={() => track('email')}
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-primary px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            Send Email
          </a>
        </div>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        Prefer a callback? Share a time and our concierge desk will reach out within the hour.
      </p>
    </div>
  );
}
