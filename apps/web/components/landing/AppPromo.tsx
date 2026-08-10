import Image from "next/image";
import { Apple, PlayCircle } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export function AppPromo() {
  return (
    <section className="py-10 sm:py-14 lg:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-brand-dark sm:rounded-[40px]">
          {/* Glow */}
          <div className="pointer-events-none absolute right-0 top-1/2 h-[140%] w-[90%] -translate-y-1/2 rounded-full bg-primary/20 blur-[110px] lg:w-[60%]" />

          {/* Border */}
          <div className="pointer-events-none absolute inset-3 rounded-[24px] border-2 border-white sm:inset-5 sm:rounded-[34px]" />

          <div className="relative z-10 grid items-center gap-10 px-5 py-8 sm:px-8 sm:py-12 md:grid-cols-2 md:gap-8 lg:px-14 lg:py-16">
            {/* LEFT */}
            <Reveal className="text-center md:text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Jayedaad App
              </span>

              <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl xl:text-6xl">
                Your next home,
                <br />
                in your pocket.
              </h2>

              <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/60 sm:text-base lg:mx-0">
                Instant alerts, AR tours, saved searches and secure chat — all
                in one beautifully designed app.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 transition hover:bg-white/90"
                >
                  <Apple className="h-5 w-5 text-slate-900" />

                  <span className="flex flex-col leading-tight text-left">
                    <span className="text-[10px] text-slate-500">
                      Download on the
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      App Store
                    </span>
                  </span>
                </a>

                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 transition hover:bg-white/90"
                >
                  <PlayCircle className="h-5 w-5 text-slate-900" />

                  <span className="flex flex-col leading-tight text-left">
                    <span className="text-[10px] text-slate-500">
                      Get it on
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      Google Play
                    </span>
                  </span>
                </a>
              </div>

              {/* QR */}
              <div className="mt-8 flex items-center justify-center gap-4 md:justify-start">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white p-1.5 sm:h-20 sm:w-20">
                  <Image
                    src="/images/qr-code.png"
                    alt="QR code to download the Jayedaad app"
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                </div>

                <p className="text-left text-xs leading-6 text-white/50 sm:text-sm">
                  Scan to download.
                  <br />
                  Available on iOS and Android.
                </p>
              </div>
            </Reveal>

            {/* RIGHT */}
            <Reveal
              delay={0.15}
              className="mx-auto flex w-full justify-center md:justify-end"
            >
              <div className="relative w-full max-w-[260px] sm:max-w-[360px] md:max-w-[430px] lg:max-w-[560px] xl:max-w-[620px]">
                <div className="relative aspect-[549/514]">
                  <Image
                    src="/images/mobile-image.png"
                    alt="Jayedaad app shown on two phones"
                    fill
                    priority={false}
                    sizes="(max-width:640px) 260px,
                           (max-width:768px) 360px,
                           (max-width:1024px) 430px,
                           560px"
                    className="object-contain"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}