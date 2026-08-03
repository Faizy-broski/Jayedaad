import Image from 'next/image';
import { Reveal } from '@/components/Reveal';

// lucide-react dropped brand/logo icons (Instagram, Facebook, LinkedIn,
// YouTube, ...) starting v1 — these are minimal inline marks so this row
// doesn't need a separate icon-library dependency for five glyphs.
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

export function FollowJourney() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-24">
      {/* Faint centered building watermark. object-contain (not cover) so
          the whole isometric house shows regardless of this short section's
          aspect ratio — cover was slicing it down to an unrecognizable
          sliver here. Sized wide enough that the tree canopies clear the
          text column on both sides, matching the reference. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
  <div className="relative h-full w-full opacity-[0.08]">
    <Image
      src="/images/contact-us/follow-our-journey.png"
      alt=""
      fill
      sizes="(min-width: 1024px) 768px, 100vw"
      className="object-cover"
    />
  </div>
</div>

      <Reveal className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 text-center">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
          <span className="h-px w-6 bg-current" />
          Follow Our Journey
          <span className="h-px w-6 bg-current" />
        </span>

        <h2 className="text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
          Stay close to the addresses
          <br />
          we&apos;re proud to represent.
        </h2>

        <div className="mt-2 flex items-center gap-3">
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
    </section>
  );
}
