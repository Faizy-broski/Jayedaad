import Image from 'next/image';
import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';

interface InfoRow {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
}

const INFO_ROWS: InfoRow[] = [
  {
    icon: MapPin,
    label: 'Address',
    value: '12-A Main Boulevard, Gulberg III, Lahore',
  },
  {
    icon: Clock,
    label: 'Hours',
    value: 'Mon–Sat · 9:00 – 20:00',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+92 42 111 000 111',
    href: 'tel:+9242111000111',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@jayedaad.com',
    href: 'mailto:hello@jayedaad.com',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+92 300 000 0000',
    href: 'https://wa.me/923000000000',
  },
];

export function OfficeShowcaseSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-14">
      <div className="relative">
        {/* Full-bleed photo — `left-1/2 -mx-[50vw] w-screen` breaks it out of
            the max-w-6xl/px-4 parent so it spans the full viewport width,
            edge to edge, while the info card below stays inside the normal
            constrained container (matching the reference design, where the
            photo goes full-bleed but the card sits inset from the edges). */}
        <div className="relative left-1/2 right-1/2 -mx-[50vw] h-[320px] w-screen overflow-hidden sm:h-[420px] md:h-[520px] lg:h-[600px]">
          <Image
            src="/images/contact-us/jayedaad-office.jpg"
            alt="Jayedaad House — head office exterior, Gulberg III, Lahore"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Info card — stacks below the photo on mobile (slightly overlapping
            its bottom edge), becomes a floating glass panel pinned to the
            right on md+ to match the reference design. */}
        <div
          className="relative -mt-10 mx-4 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur-sm sm:mx-6 sm:p-8 md:absolute md:inset-y-8 md:right-8 md:mx-0 md:mt-0 md:flex md:w-[360px] md:flex-col md:justify-center lg:right-10 lg:w-[400px] lg:p-9"
        >
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Head office</span>

          <h2 className="mt-2 text-2xl font-bold leading-tight text-heading-gradient sm:text-3xl">
            Jayedaad House,
            <br />
            Lahore.
          </h2>

          <dl className="mt-6 flex flex-col gap-4 sm:mt-7">
            {INFO_ROWS.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-secondary">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</dt>
                  {href ? (
                    <dd className="mt-0.5 truncate text-sm font-medium text-slate-800">
                      <a href={href} className="hover:text-primary">
                        {value}
                      </a>
                    </dd>
                  ) : (
                    <dd className="mt-0.5 text-sm font-medium leading-snug text-slate-800">{value}</dd>
                  )}
                </div>
              </div>
            ))}
          </dl>

          <a
            href="https://maps.google.com/?q=12-A+Main+Boulevard,+Gulberg+III,+Lahore"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-heading-gradient px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 sm:mt-8"
          >
            <Navigation className="h-4 w-4" />
            Get directions
          </a>
        </div>
      </div>
    </section>
  );
}