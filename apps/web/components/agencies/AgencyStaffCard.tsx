import Image from 'next/image';
import { Mail, PhoneCall, User2 } from 'lucide-react';
import type { AgencyStaffPreview } from '@jayedaad/core';

// Compact staff card for the Agency detail page's horizontally-scrolling
// "Agency Staff" strip. Email deliberately points at the same fixed support
// address AgentCard.tsx's per-listing agent card uses — agent_profiles has
// no email column of its own (it lives on auth.users, not public data).
export function AgencyStaffCard({ staff }: { staff: AgencyStaffPreview }) {
  const name = staff.displayName ?? 'Agency Staff';

  return (
    <div className="flex w-[220px] shrink-0 flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-primary/10">
        {staff.photoUrl ? (
          <Image src={staff.photoUrl} alt={name} fill sizes="64px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-primary">
            <User2 className="h-6 w-6" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        {staff.title && <p className="truncate text-xs text-slate-500">{staff.title}</p>}
      </div>
      <div className="flex w-full gap-2">
        <a
          href="mailto:hello@jayedaad.com"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          Email
        </a>
        {staff.phone && (
          <a
            href={`tel:${staff.phone}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-heading-gradient px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PhoneCall className="h-3.5 w-3.5 shrink-0" />
            Call
          </a>
        )}
      </div>
    </div>
  );
}
