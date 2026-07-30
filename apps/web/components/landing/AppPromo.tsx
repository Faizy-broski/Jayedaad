import Image from 'next/image';
import { Apple, PlayCircle, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

export function AppPromo() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-brand-dark">
          {/* Faint radial glow behind the phones, standard treatment for a
              dark CTA panel like this rather than a flat fill. */}
          <div className="pointer-events-none absolute right-0 top-1/2 h-[140%] w-[60%] -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />

          <div className="relative z-10 grid gap-10 px-6 py-14 sm:px-10 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-6 lg:px-14">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Jayedaad App</span>

              <h2 className="mt-4 text-4xl font-bold leading-[1.1] text-white sm:text-5xl">
                Your next home,
                <br />
                in your pocket.
              </h2>

              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
                Instant alerts, AR tours, saved searches and secure chat — all in one beautifully designed app.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 transition-colors hover:bg-white/90"
                >
                  <Apple className="h-5 w-5 text-slate-900" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] text-slate-500">Download on the</span>
                    <span className="text-sm font-semibold text-slate-900">App Store</span>
                  </span>
                </a>

                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 transition-colors hover:bg-white/90"
                >
                  <PlayCircle className="h-5 w-5 text-slate-900" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] text-slate-500">Get it on</span>
                    <span className="text-sm font-semibold text-slate-900">Google Play</span>
                  </span>
                </a>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white p-1.5">
                  <Image src="/images/qr-code.png" alt="QR code to download the Jayedaad app" fill sizes="64px" className="object-contain p-1" />
                </div>
                <p className="text-xs leading-relaxed text-white/50">
                  Scan to download.
                  <br />
                  Available on iOS and Android.
                </p>
              </div>
            </Reveal>

            <Reveal className="relative mx-auto w-full max-w-md lg:max-w-none" delay={0.15}>
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/mobile-image.png"
                  alt="Jayedaad app shown on two phones — a property listing and saved homes"
                  fill
                  sizes="(min-width: 1024px) 50vw, 90vw"
                  className="object-contain object-center lg:object-right"
                />

                <div className="absolute bottom-[8%] right-[6%] flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-lg">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-slate-900">AI recommends</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}