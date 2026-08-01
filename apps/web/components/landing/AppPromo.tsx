import Image from 'next/image';
import { Apple, PlayCircle, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

export function AppPromo() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-dark sm:rounded-[2.5rem]">
          {/* Faint radial glow behind the phones */}
          <div className="pointer-events-none absolute right-0 top-1/2 h-[140%] w-[80%] -translate-y-1/2 rounded-full bg-primary/20 blur-[100px] sm:w-[60%]" />

          {/* Decorative border frame, stretched over the card in place of a
              plain CSS border. */}
          <Image
            src="/images/rectangle-frame.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 1152px, 100vw"
            className="pointer-events-none z-20 p-5 object-fill"
          />

          <div className="relative z-10 grid gap-8 px-6 py-10 sm:gap-10 sm:px-10 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-6 lg:px-14">
            <Reveal className="order-1 text-center lg:order-none lg:text-left">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Jayedaad App</span>

              <h2 className="mt-4 text-4xl font-bold leading-[1.1] text-white sm:text-5xl">
                Your next home,
                <br />
                in your pocket.
              </h2>

              <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-white/60 lg:mx-0">
                Instant alerts, AR tours, saved searches and secure chat — all in one beautifully designed app.
              </p>
            </Reveal>

            <Reveal
              className="relative order-2 mx-auto w-full max-w-[260px] sm:max-w-md lg:order-none lg:row-span-2 lg:max-w-none"
              delay={0.15}
            >
              <div className="relative aspect-[549/514] w-full lg:aspect-[4/3]">
                <Image
                  src="/images/mobile-image.png"
                  alt="Jayedaad app shown on two phones — a property listing and saved homes"
                  fill
                  sizes="(min-width: 1024px) 50vw, 70vw"
                  className="object-contain object-center lg:object-right"
                  priority={false}
                />
              </div>
            </Reveal>

            <Reveal className="order-3 text-center lg:order-none lg:text-left" delay={0.1}>
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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

              <div className="mt-8 flex items-center justify-center gap-12 lg:gap-6 lg:justify-start">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white p-1.5">
                  <Image src="/images/qr-code.png" alt="QR code to download the Jayedaad app" fill sizes="64px" className="object-contain p-1" />
                </div>
                <p className="text-left text-xs leading-relaxed text-white/50">
                  Scan to download.
                  <br />
                  Available on iOS and Android.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}