'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { COUNTRIES, getMaxPhoneDigits, LeadInquirerType, leadsRepository, useAuthViewModel } from '@jayedaad/core';
import { Button, Checkbox, CountryCodeSelect, Input, Label } from '@jayedaad/ui-web';

export type EnquiryTarget =
  | { type: 'listing'; id: string; title: string; referenceLabel: string }
  | { type: 'project'; id: string; title: string };

interface EnquiryDialogProps {
  target: EnquiryTarget;
  intent: 'inquiry' | 'visit';
}

const INQUIRER_OPTIONS: { value: LeadInquirerType; label: string }[] = [
  { value: 'buyer_tenant', label: 'Buyer/Tenant' },
  { value: 'agent', label: 'Agent' },
  { value: 'other', label: 'Other' },
];

// Ported from apps/mobile/src/screens/ListingDetailScreen.tsx's EnquiryDialog
// — same fields/validation/submit logic, built against this app's own
// Modal/Input/CountryCodeSelect primitives. Shared by both listing and
// project detail pages (see EnquiryTarget) since leadsRepository.create()
// now accepts either listingId or projectId (see leads.repository.ts's
// createForListing/createForProject split) — the message template and
// submit payload are the only things that vary by target type.
//
// Always rendered in place (no open/close, no popup) — the surrounding
// "Book a visit"/"Send Enquiry" buttons just switch `intent`, which swaps
// the pre-filled message template; they never hide/show the form itself.
export function EnquiryDialog({ target, intent }: EnquiryDialogProps) {
  const { user } = useAuthViewModel();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('92');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [inquirerType, setInquirerType] = useState<LeadInquirerType>('buyer_tenant');
  const [wantsSimilarAlerts, setWantsSimilarAlerts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName((user?.user_metadata?.display_name as string | undefined) ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  useEffect(() => {
    setMessage(buildTemplate(target, intent));
  }, [target, intent]);

  async function handleSend() {
    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await leadsRepository.create({
        listingId: target.type === 'listing' ? target.id : undefined,
        projectId: target.type === 'project' ? target.id : undefined,
        name: name.trim(),
        email: email.trim(),
        phone: `+${dialCode.replace(/\D/g, '')}${phone}`,
        message: message.trim(),
        source: 'contact_form',
        inquirerType,
        wantsSimilarAlerts,
        isVisitRequest: intent === 'visit',
      });
      toast.success(intent === 'visit' ? 'Visit request sent.' : 'Enquiry sent.');
      setMessage(buildTemplate(target, intent));
      setPhone('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Plain inline panel — no popup/backdrop/portal, always mounted. Renders
  // directly in the page flow wherever the caller places <EnquiryDialog>;
  // callers space it via their own flex/grid gap, not a margin here.
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-900">{intent === 'visit' ? 'Book a Visit' : 'Send Enquiry'}</h3>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Name*</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Email*</Label>
          <Input type="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone*</Label>
          <div className="flex items-center gap-2">
            <CountryCodeSelect countries={COUNTRIES} value={dialCode} onChange={setDialCode} className="h-10 w-[110px] shrink-0 rounded-full" />
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="3XXXXXXXXX"
              value={phone}
              maxLength={getMaxPhoneDigits(dialCode)}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
              className="h-10 min-w-0 flex-1 rounded-full border-input px-5"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Message*</Label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label>I am a:</Label>
          <div className="flex flex-wrap gap-4">
            {INQUIRER_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-1.5 text-sm text-foreground">
                <input
                  type="radio"
                  name="inquirerType"
                  checked={inquirerType === option.value}
                  onChange={() => setInquirerType(option.value)}
                  className="h-4 w-4 accent-primary"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-2 text-xs leading-tight text-muted-foreground">
          <Checkbox checked={wantsSimilarAlerts} onChange={(e) => setWantsSimilarAlerts(e.target.checked)} className="mt-0.5" />
          Keep me informed about similar properties.
        </label>
        <Button onClick={handleSend} disabled={submitting} className="w-full">
          {submitting ? 'Sending…' : intent === 'visit' ? 'Send Visit Request' : 'Send Enquiry'}
        </Button>
      </div>
    </div>
  );
}

function buildTemplate(target: EnquiryTarget, intent: 'inquiry' | 'visit'): string {
  // Listings carry a real reference number (JYD-##### — see PropertyDetail.tsx);
  // projects have no equivalent numeric id in the schema, so the template
  // just uses the project name for those.
  const subject = target.type === 'listing' ? `${target.title} - ID${target.referenceLabel}` : target.title;
  if (intent === 'visit') {
    return `I would like to book a visit to see ${subject}. Please let me know your available times.`;
  }
  const noun = target.type === 'listing' ? 'your property' : 'your project';
  return `I would like to inquire about ${noun} ${subject}. Please contact me at your earliest convenience.`;
}
