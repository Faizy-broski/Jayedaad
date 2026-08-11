import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Home, Building2, Briefcase, LifeBuoy } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

interface ContactOption {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Home;
  image?: string;
}

const CONTACT_OPTIONS: ContactOption[] = [
  {
    id: 'buy-invest',
    eyebrow: 'Sales',
    title: 'Looking to buy or invest?',
    description: 'Speak with a dedicated property consultant.',
    href: '/search',
    icon: Home,
    image: '/images/services-image.png',
  },
  {
    id: 'sell-rent',
    eyebrow: 'Property Owners',
    title: 'Want to sell or rent your property?',
    description: "List with Jayedaad's advisory team.",
    href: '/submit',
    icon: Building2,
  },
  {
    id: 'commercial',
    eyebrow: 'Commercial',
    title: 'Need offices or commercial spaces?',
    description: 'Talk to our business advisors.',
    href: '/search?type=commercial',
    icon: Briefcase,
  },
  {
    id: 'support',
    eyebrow: 'Customer Support',
    title: 'Already using Jayedaad?',
    description: "We're always here to help.",
    href: '/help',
    icon: LifeBuoy,
  },
];

// lucide-react dropped brand/logo icons (Instagram, Facebook, LinkedIn,
// YouTube, ...) starting v1 — these are minimal inline marks so the "Follow
// Our Journey" row below doesn't need a separate icon-library dependency
// for five glyphs. Moved here from the now-removed FollowJourney.tsx.
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H16.7V3.7c-.3-.04-1.3-.13-2.46-.13-2.44 0-4.1 1.49-4.1 4.22V9.9H7.4V13h2.74v8h3.36Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3.5A1.96 1.96 0 1 0 5.25 7.4a1.96 1.96 0 0 0 0-3.9ZM20.44 20h-3.37v-5.6c0-1.34-.02-3.05-1.86-3.05-1.87 0-2.16 1.46-2.16 2.96V20H9.68V8.5h3.24v1.57h.05c.45-.86 1.56-1.77 3.2-1.77 3.43 0 4.27 2.26 4.27 5.19V20Z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M22 12s0-3.2-.4-4.7a3 3 0 0 0-2.1-2.1C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.5.4A3 3 0 0 0 2.4 7.3C2 8.8 2 12 2 12s0 3.2.4 4.7a3 3 0 0 0 2.1 2.1c1.6.4 7.5.4 7.5.4s5.9 0 7.5-.4a3 3 0 0 0 2.1-2.1c.4-1.5.4-4.7.4-4.7Zm-12.3 3V9l5.2 3-5.2 3Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 3a9 9 0 0 0-7.75 13.55L3 21l4.6-1.2A9 9 0 1 0 12 3Zm0 16.2a7.15 7.15 0 0 1-3.65-1l-.26-.15-2.72.71.73-2.65-.17-.27A7.2 7.2 0 1 1 12 19.2Zm3.95-5.4c-.22-.11-1.28-.63-1.48-.7-.2-.08-.34-.11-.49.11-.14.22-.56.7-.69.84-.13.14-.25.16-.47.05a5.9 5.9 0 0 1-1.73-1.07 6.5 6.5 0 0 1-1.2-1.49c-.13-.22 0-.34.1-.45.1-.1.22-.25.33-.38.11-.13.14-.22.22-.36.07-.14.04-.27-.02-.38-.06-.11-.49-1.18-.67-1.62-.18-.42-.36-.36-.49-.37h-.42a.8.8 0 0 0-.58.27 2.44 2.44 0 0 0-.76 1.81c0 1.07.78 2.1.89 2.25.11.14 1.53 2.34 3.71 3.28.52.22.92.36 1.24.46.52.16 1 .14 1.37.09.42-.06 1.28-.52 1.46-1.03.18-.5.18-.94.13-1.03-.05-.09-.2-.14-.42-.25Z" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com', Icon: InstagramIcon },
  { label: 'Facebook', href: 'https://facebook.com', Icon: FacebookIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', Icon: LinkedInIcon },
  { label: 'YouTube', href: 'https://youtube.com', Icon: YoutubeIcon },
  { label: 'WhatsApp', href: 'https://wa.me/923000000000', Icon: WhatsAppIcon },
];

export function HowCanWeHelp() {
  return (
    <section className="relative overflow-hidden pt-16 sm:pt-20">
      {/* h-[Npx] (not h-2/3) on purpose — this box is absolutely positioned
          inside a height:auto section, so a percentage height has no
          containing-block height to resolve against and silently collapses
          to zero. A fixed height per breakpoint keeps it reliably pinned to
          the bottom on every screen size instead. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[360px] sm:h-[440px] lg:h-[820px]">
        <div className="relative h-full w-full opacity-[0.08] [mask-image:linear-gradient(to_bottom,transparent,black_25%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_25%)]">
          <Image
            src="/images/contact-us/follow-our-journey.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
              02 — How Can We Help
            </span>
            <h2 className="mt-2 max-w-sm text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
              Four ways to begin the conversation.
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
            Every enquiry is handled personally by a specialist who understands the market you&apos;re moving in.
          </p>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONTACT_OPTIONS.map(({ id, eyebrow, title, description, href, icon: Icon, image }, index) => (
            <Reveal key={id} delay={(index % 2) * 0.08}>
              {image ? (
                <Link
                  href={href}
                  className="group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl p-5"
                >
                  <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="(min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

                  <div className="relative z-10 flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors group-hover:bg-white/25">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="relative z-10 flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{eyebrow}</span>
                    <span className="text-lg font-semibold text-white">{title}</span>
                    <span className="text-xs text-white/70">{description}</span>
                  </div>
                </Link>
              ) : (
                <Link
                  href={href}
                  className="group flex h-full min-h-[220px] flex-col justify-between rounded-2xl bg-[#F3F4F6] p-5 transition-colors hover:bg-[#F3F4F6]/50"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors group-hover:text-primary">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{eyebrow}</span>
                    <span className="text-lg font-semibold text-slate-900">{title}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </div>
                </Link>
              )}
            </Reveal>
          ))}
        </div>

        {/* Follow Our Journey — merged in from FollowJourney.tsx so both
            blocks share the single watermark background above. */}
        <div className="relative pb-16 sm:pb-24">
          <Reveal className="mx-auto mt-16 flex max-w-2xl flex-col items-center gap-6 px-4 pt-8 text-center sm:mt-24">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
              <span className="h-px w-6 bg-current" />
              Follow Our Journey
              <span className="h-px w-6 bg-current" />
            </span>

            <h2 className="text-2xl font-bold leading-tight text-heading-gradient sm:text-5xl">
              Stay close to the addresses
              <br />
              we&apos;re proud to represent.
            </h2>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="bg-heading-gradient flex h-11 w-11 items-center justify-center rounded-full text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
