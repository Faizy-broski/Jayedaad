import Image from 'next/image';
import Link from 'next/link';

export function ConciergeBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <Image
        src="/images/listing-hero-bg.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 1152px, 100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/40 via-brand-dark/50 to-brand-dark/40" />

      <div className="relative z-10 flex flex-col gap-6 px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span className="eyebrow-label text-white/50">Concierge</span>
          <h2 className="heading-2 mt-3 max-w-md text-white">Need help finding the perfect property?</h2>
          <p className="body-text mt-3 max-w-md text-white/60">
            Our advisors curate a shortlist tailored to your lifestyle, budget and long-term goals. Complimentary and
            confidential.
          </p>
        </div>

        <div className="flex flex-col shrink-0 flex-wrap items-center gap-3">
          <Link
            href="/contact-us"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-white/90"
          >
            Talk to an expert
          </Link>
          <Link
            href="/contact-us"
            className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Request a callback
          </Link>
        </div>
      </div>
    </div>
  );
}
