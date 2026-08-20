'use client';

import Image from 'next/image';
import { BadgeCheck, Mail, MessageSquare, PhoneCall } from 'lucide-react';
import { listingsRepository } from '@jayedaad/core';
import { Badge } from '@jayedaad/ui-web';
import { EnquiryDialog } from '@/components/shared/EnquiryDialog';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { getViewerSessionId } from '@/lib/viewerSession';
import type { ListingProperty } from '@/lib/types';

interface AgentCardProps {
  agent: ListingProperty['agent'];
  /** Drives the "Verified agent"/"Verified owner" copy below — 'owner'
   *  means this card is fronting the property owner directly, not a
   *  professional agent (see listingToListingProperty's agent.name/role
   *  fallback for the same 'owner' case). */
  posterType?: 'owner' | 'agent' | 'agency';
  listingId: string;
  listingTitle: string;
  /** Zero-padded listing_number, e.g. "00123" — see PropertyDetail.tsx. */
  referenceLabel: string;
  /** Lets a future top-of-page action drive this same always-visible form
   *  (switch it to the visit template) without duplicating a second form.
   *  Defaults to 'inquiry' when omitted. onIntentChange is accepted for API
   *  parity but isn't called from within this card — its own quick-action
   *  that used to reset back to 'inquiry' was replaced by the real Email
   *  mailto: below (see the comment on the quick-actions row), same change
   *  as DeveloperCard.tsx's equivalent. */
  intent?: 'inquiry' | 'visit';
  onIntentChange?: (intent: 'inquiry' | 'visit') => void;
}

export function AgentCard({ agent, posterType, listingId, listingTitle, referenceLabel, intent = 'inquiry' }: AgentCardProps) {
  // Fire-and-forget — feeds the agent dashboard's Calls/WhatsApp/SMS/Emails
  // analytics (see packages/core's listingsRepository.trackEngagement);
  // never blocks the real tel:/wa.me/sms:/mailto: action.
  function track(type: 'call' | 'whatsapp' | 'sms' | 'email') {
    listingsRepository
      .trackEngagement(listingId, { type, platform: 'web', viewerSessionId: getViewerSessionId() })
      .catch(() => {});
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100">
          <Image src={agent.avatar} alt={agent.name} fill sizes="44px" className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-slate-900">{agent.name}</span>
          <span className="truncate text-xs text-slate-500">{agent.role}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <BadgeCheck className="h-3.5 w-3.5" />
          {posterType === 'owner' ? 'Verified owner' : 'Verified agent'}
        </div>
        {agent.subscriptionTierName && <Badge variant="success">{agent.subscriptionTierName}</Badge>}
      </div>

      <EnquiryDialog intent={intent} target={{ type: 'listing', id: listingId, title: listingTitle, referenceLabel }} />

      {/* Quick links above the tracked form — Call/WhatsApp stay direct
          tel:/wa.me. This row used to have a second "Send Enquiry" button
          too, which just duplicated the form already visible right above —
          replaced with a real mailto: to the agent's actual account email
          (always real — an agent is a real auth account, unlike a developer
          catalog entry, so unlike DeveloperCard.tsx this is never hidden for
          missing data; see ListingsRepository.findById's email resolution).
          WhatsApp uses the real brand mark/green, not a generic icon. */}
      <div className="flex flex-col gap-2">
        <a
          href={`tel:${agent.phone}`}
          onClick={() => track('call')}
          className="flex items-center justify-center gap-2 rounded-full bg-heading-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <PhoneCall className="h-4 w-4" />
          Call agent
        </a>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${agent.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp')}
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#25D366] px-4 py-2.5 text-sm font-bold text-[#25D366] transition-colors hover:bg-[#25D366]/5"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
            WhatsApp
          </a>
          <a
            href={`sms:${agent.phone}`}
            onClick={() => track('sms')}
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-primary px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            SMS
          </a>
          <a
            href={`mailto:${agent.email ?? ''}`}
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
