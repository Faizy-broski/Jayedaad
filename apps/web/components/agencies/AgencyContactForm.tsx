'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useContactViewModel } from '@jayedaad/core';

const INPUT_CLASSES =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none';

// Reuses the shared Contact Us intake (POST /contact — see
// contactRepository/useContactViewModel) rather than a new endpoint, with
// agencyId set so the submission is attributed to this agency (see
// 0041_contact_messages_agency_id.sql). Uncontrolled inputs read via
// FormData, same pattern as apps/web/components/contact-us/Consultation.tsx.
export function AgencyContactForm({ agencyId, agencyName }: { agencyId: string; agencyName: string }) {
  const { submit } = useContactViewModel();
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    try {
      await submit.mutateAsync({
        name: (form.get('name') as string) || undefined,
        phone: (form.get('phone') as string) || undefined,
        email: (form.get('email') as string) || undefined,
        subject: (form.get('subject') as string) || `Inquiry for ${agencyName}`,
        message: (form.get('message') as string) || undefined,
        agencyId,
      });
      setSent(true);
      toast.success('Your question has been sent.');
      e.currentTarget.reset();
    } catch {
      toast.error('Something went wrong — please try again.');
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-900">Thanks — your question is on its way.</p>
        <p className="mt-1 text-xs text-slate-500">{agencyName} will get back to you shortly.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-3 text-xs font-medium text-primary hover:underline"
        >
          Send another question
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <label htmlFor="agency-contact-name" className="mb-1 block text-xs font-medium text-slate-600">
          Your Name
        </label>
        <input id="agency-contact-name" name="name" placeholder="How should we address you?" className={INPUT_CLASSES} />
      </div>
      <div>
        <label htmlFor="agency-contact-phone" className="mb-1 block text-xs font-medium text-slate-600">
          Phone Number
        </label>
        <input id="agency-contact-phone" name="phone" type="tel" placeholder="+92" className={INPUT_CLASSES} />
      </div>
      <div>
        <label htmlFor="agency-contact-email" className="mb-1 block text-xs font-medium text-slate-600">
          Email Address
        </label>
        <input id="agency-contact-email" name="email" type="email" placeholder="Your best email address" className={INPUT_CLASSES} />
      </div>
      <div>
        <label htmlFor="agency-contact-subject" className="mb-1 block text-xs font-medium text-slate-600">
          Subject
        </label>
        <input id="agency-contact-subject" name="subject" placeholder="General Inquiry" className={INPUT_CLASSES} />
      </div>
      <div>
        <label htmlFor="agency-contact-message" className="mb-1 block text-xs font-medium text-slate-600">
          Your Message
        </label>
        <textarea
          id="agency-contact-message"
          name="message"
          rows={3}
          placeholder="What would you like to say?"
          className={`${INPUT_CLASSES} resize-none`}
        />
      </div>
      <button
        type="submit"
        disabled={submit.isPending}
        className="mt-1 flex items-center justify-center gap-2 rounded-full bg-heading-gradient px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submit.isPending ? 'Sending…' : 'Send Your Question'}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        By submitting this form, you agree to our Terms of Use.
      </p>
    </form>
  );
}
