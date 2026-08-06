'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useContactViewModel } from '@jayedaad/core';

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const PURPOSE_OPTIONS = ['Buying', 'Selling', 'Renting', 'Investing', 'Just exploring'];
const CITY_OPTIONS = ['Lahore', 'Islamabad', 'Karachi', 'Rawalpindi', 'Faisalabad'];

const LOCATION_FEATURES = ['Metro · 4 min', 'Parking on-site', 'Main Boulevard access'];

// Static Google Maps embed pointed at Gulberg III, Lahore — Jayedaad's
// primary consultation office. Swap the `src` if the office location
// changes; no API key is required for the basic embed endpoint.
const MAP_EMBED_SRC =
  'https://www.google.com/maps?q=Gulberg+III,+Lahore,+Pakistan&output=embed';

export function ConsultationSection() {
  const { submit } = useContactViewModel();
  const [submitted, setSubmitted] = useState(false);

  // Uncontrolled form (every field already has a matching `name` attribute)
  // read via FormData at submit time — this was previously entirely fake
  // (e.setPreventDefault() + local state only, no backend call at all).
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      await submit.mutateAsync({
        name: String(data.get('fullName') ?? '') || undefined,
        email: String(data.get('email') ?? '') || undefined,
        phone: String(data.get('phone') ?? ''),
        purpose: String(data.get('purpose') ?? '') || undefined,
        city: String(data.get('city') ?? '') || undefined,
        budget: String(data.get('budget') ?? '') || undefined,
        message: String(data.get('message') ?? '') || undefined,
      });
      setSubmitted(true);
      form.reset();
    } catch {
      toast.error('Something went wrong — please try again.');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-28">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left column — pitch + location */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="flex flex-col"
        >
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            01 <span className="text-slate-300">—</span> Book a consultation
          </span>

          <h2 className="mt-4 text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl md:text-[2.75rem]">
            Your property
            <br />
            journey starts here.
          </h2>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Share a few details and one of our senior advisors will reach out within the hour — private,
            unhurried, and tailored to your search. No obligations. No noise. Just the right introduction.
          </p>

          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            {LOCATION_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-heading-gradient" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="relative mt-8 aspect-[4/3] w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm sm:aspect-[16/10] lg:aspect-auto lg:flex-1 lg:min-h-[280px]">
            <iframe
              src={MAP_EMBED_SRC}
              title="Jayedaad office location — Gulberg III, Lahore"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0 grayscale-[15%]"
            />

            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-heading-gradient">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-700 sm:text-[11px]">
                Gulberg III, Lahore
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right column — form card */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 md:p-10"
        >
          {/* Watermark logo — sits behind the fields, faint, centered across
              the whole card so it reads at a glance rather than hiding as a
              sliver behind the submit button. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
            <Image
              src="/images/jayedaad-big-logo.png"
              alt=""
              width={420}
              height={420}
              className="h-auto w-[85%] max-w-md select-none"
            />
          </div>

          <form className="relative z-10 flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Full name <span className="normal-case text-slate-300">(optional)</span>
                </span>
                <input
                  name="fullName"
                  placeholder="Your full name"
                  className="border-b border-slate-200 bg-transparent pb-2 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Email <span className="normal-case text-slate-300">(optional)</span>
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@email.com"
                  className="border-b border-slate-200 bg-transparent pb-2 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone</span>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+92 300 000 0000"
                  className="border-b border-slate-200 bg-transparent pb-2 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Purpose <span className="normal-case text-slate-300">(optional)</span>
                </span>
                <select
                  name="purpose"
                  defaultValue=""
                  className="border-b border-slate-200 bg-transparent pb-2 text-sm font-medium text-slate-800 focus:border-primary focus:outline-none [&:required:invalid]:text-slate-400"
                >
                  <option value="">Select...</option>
                  {PURPOSE_OPTIONS.map((option) => (
                    <option key={option} value={option} className="text-slate-800">
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Preferred city
                </span>
                <select
                  name="city"
                  defaultValue=""
                  required
                  className="border-b border-slate-200 bg-transparent pb-2 text-sm font-medium text-slate-800 focus:border-primary focus:outline-none [&:required:invalid]:text-slate-400"
                >
                  <option value="" disabled>
                    Select...
                  </option>
                  {CITY_OPTIONS.map((option) => (
                    <option key={option} value={option} className="text-slate-800">
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Budget <span className="normal-case text-slate-300">(optional)</span>
                </span>
                <input
                  name="budget"
                  placeholder="PKR"
                  className="border-b border-slate-200 bg-transparent pb-2 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-primary focus:outline-none"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Message</span>
              <textarea
                name="message"
                rows={2}
                placeholder="Tell us about what you're looking for..."
                className="resize-none border-b border-slate-200 bg-transparent pb-2 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-primary focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={submit.isPending || submitted}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-heading-gradient px-6 py-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Request received
                </>
              ) : submit.isPending ? (
                'Sending…'
              ) : (
                <>
                  Schedule consultation
                  <ArrowUpRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] leading-relaxed text-slate-400">
              By submitting, you agree to Jayedaad&apos;s private consultation policy.
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}