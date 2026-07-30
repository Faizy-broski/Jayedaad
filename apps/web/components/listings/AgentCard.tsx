import Image from 'next/image';
import { BadgeCheck, CalendarCheck, PhoneCall, MessageCircle, Mail } from 'lucide-react';
import type { ListingProperty } from '@/lib/types';

interface AgentCardProps {
  agent: ListingProperty['agent'];
}

export function AgentCard({ agent }: AgentCardProps) {
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

      <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified agent
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-full bg-heading-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <CalendarCheck className="h-4 w-4" />
          Book a visit
        </button>
        <a
          href={`tel:${agent.phone}`}
          className="flex items-center justify-center gap-2 rounded-full bg-brand-dark px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <PhoneCall className="h-4 w-4" />
          Call agent
        </a>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${agent.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
            WhatsApp
          </a>
          <a
            href="mailto:hello@jayedaad.com"
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            Email
          </a>
        </div>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        Prefer a callback? Share a time and our concierge desk will reach out within the hour.
      </p>
    </div>
  );
}
