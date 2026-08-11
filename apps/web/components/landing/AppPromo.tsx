import Image from "next/image";
import { Apple, PlayCircle } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export function AppPromo() {
  return (
    <section className="py-10 sm:py-14 lg:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="group/section relative overflow-hidden rounded-[28px] bg-brand-dark sm:rounded-[40px]">
          {/* Glow — grows and brightens slightly on section hover */}
          <div className="pointer-events-none absolute right-0 top-1/2 h-[140%] w-[90%] -translate-y-1/2 rounded-full bg-primary/20 blur-[110px] transition-all duration-700 ease-out group-hover/section:w-[100%] group-hover/section:bg-primary/30 lg:w-[60%] lg:group-hover/section:w-[68%]" />

          {/* Secondary accent glow, bottom-left, subtle */}
          <div className="pointer-events-none absolute -left-10 bottom-0 h-[60%] w-[40%] rounded-full bg-primary/10 blur-[100px] transition-opacity duration-700 ease-out group-hover/section:opacity-100 opacity-60" />

          {/* Border — brightens on hover */}
          <div className="pointer-events-none absolute inset-3 rounded-[24px] border-2 border-white/100 transition-colors duration-500 sm:inset-5 sm:rounded-[34px] group-hover/section:border-white" />

          <div className="relative z-10 grid items-center gap-10 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-2 lg:gap-8 lg:px-14 lg:py-16">
            {/* LEFT */}
            <Reveal className="text-center lg:text-left">
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
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 shadow-lg shadow-black/0 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-black/30 active:translate-y-0 active:scale-95"
                >
                  <Apple className="h-5 w-5 text-slate-900 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6" />

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
                  className="group flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 shadow-lg shadow-black/0 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-black/30 active:translate-y-0 active:scale-95"
                >
                  <PlayCircle className="h-5 w-5 text-slate-900 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6" />

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
              <div className="mt-8 flex items-center justify-center gap-4 lg:justify-start">
                <div className="group/qr relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-primary/30 sm:h-20 sm:w-20">
                  <Image
                    src="/images/qr-code.png"
                    alt="QR code to download the Jayedaad app"
                    fill
                    sizes="80px"
                    className="object-contain p-1 transition-transform duration-300 ease-out group-hover/qr:scale-105"
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
              className="mx-auto flex w-full justify-center lg:justify-end"
            >
              <div className="group/phone relative w-full max-w-[260px] transition-transform duration-500 ease-out hover:-translate-y-2 sm:max-w-[360px] md:max-w-[430px] lg:max-w-[560px] xl:max-w-[620px]">
                <div className="relative aspect-[549/514] transition-transform duration-500 ease-out group-hover/phone:scale-[1.03]">
                  <Image
                    src="/images/mobile-image.png"
                    alt="Jayedaad app shown on two phones"
                    fill
                    priority={false}
                    sizes="(max-width:640px) 260px,
                           (max-width:768px) 360px,
                           (max-width:1024px) 430px,
                           560px"
                    className="object-contain drop-shadow-2xl"
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