import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/data/footer";
import { Reveal } from "@/components/Reveal";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden text-white">
      {/* Background */}
      <Image
        src="/images/footer-bg.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10">
        {/* CTA */}
        <Reveal
          className="
            mx-auto
            flex
            max-w-4xl
            flex-col
            items-center
            gap-5
            px-4
            pb-12
            pt-16
            text-center

            sm:gap-6
            sm:pb-16
            sm:pt-24
          "
        >
          <span
            className="
              flex
              items-center
              gap-1.5
              rounded-full
              border
              border-white/25
              bg-white/10
              px-4
              py-1.5
              text-xs
              font-medium
              text-white/90
              backdrop-blur-sm
            "
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ready when you are
          </span>

          <h2
            className="
              text-3xl
              font-bold
              leading-[1.15]

              sm:text-4xl
              lg:text-5xl
            "
          >
            Ready to find your
            <br />
            dream property?
          </h2>

          <p
            className="
              max-w-md
              text-sm
              leading-relaxed
              text-white/70

              sm:text-base
            "
          >
            Join 50,000+ Pakistanis who found their home through Jayedaad.
          </p>

          <div
            className="
              mt-2
              flex
              w-full
              flex-col
              gap-3

              xs:w-auto
              sm:flex-row
              sm:w-auto
            "
          >
            <Link
              href="/listings"
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-full
                bg-heading-gradient
                px-6
                py-3
                text-sm
                font-medium
                text-white

                transition-all
                duration-200
                hover:scale-[1.03]
                hover:opacity-90
              "
            >
              Browse properties
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/submit"
              className="
                flex
                items-center
                justify-center
                rounded-full
                border
                border-white/30
                bg-white/10
                px-6
                py-3
                text-sm
                font-medium
                text-white
                backdrop-blur-sm

                transition-all
                duration-200
                hover:scale-[1.03]
                hover:bg-white/20
              "
            >
              Post property
            </Link>
          </div>
        </Reveal>

        <div className="mx-auto max-w-6xl border-t border-white/15" />

        {/* FOOTER CONTENT */}
        <Reveal
          className="
            mx-auto
            max-w-6xl
            px-4
            py-10

            sm:px-6
            lg:px-8
          "
          delay={0.05}
        >
          <div
            className="
              grid
              grid-cols-2
              gap-x-5
              gap-y-10

              sm:grid-cols-3

              lg:grid-cols-[1.7fr_1fr_1fr_1fr]
              lg:gap-8
            "
          >
            {/* BRAND */}
            <div
              className="
                col-span-2

                sm:col-span-3

                lg:col-span-1
              "
            >
              <Link
                href="/"
                className="
                  inline-flex
                  transition-opacity
                  hover:opacity-80
                "
              >
                <Image
                  src="/images/jayedaad-white-logo.png"
                  alt="Jayedaad"
                  width={160}
                  height={45}
                  className="
                    h-20
                    w-auto

                    sm:h-24

                    lg:h-28
                  "
                />
              </Link>

              <p
                className="
                  mt-3
                  max-w-xs
                  text-xs
                  leading-relaxed
                  text-white/60

                  sm:mt-4
                "
              >
                Building trust in real estate — Pakistan&apos;s smartest
                platform for buying, selling, and renting verified properties.
              </p>
            </div>

            {/* LINKS */}
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <span className="text-sm font-semibold text-white">
                  {column.title}
                </span>

                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="
                          inline-block
                          text-sm
                          text-white/60

                          transition-all
                          duration-200

                          hover:translate-x-0.5
                          hover:text-white
                        "
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* BOTTOM BAR */}
          <div
            className="
              mt-10
              flex
              flex-col
              items-center
              gap-5

              border-t
              border-white/15

              pt-6

              sm:mt-14
              sm:flex-row
              sm:justify-between
            "
          >
            <p className="text-center text-xs text-white/50 sm:text-left">
              &copy; {year} Jayedaad. Building trust in real estate.
            </p>

            <div
              className="
                flex
                flex-wrap
                justify-center
                gap-x-6
                gap-y-3
              "
            >
              {SOCIAL_LINKS.map((social: { label: string; href: string }) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                      text-xs
                      text-white/60

                      transition-all
                      hover:-translate-y-0.5
                      hover:text-white
                    "
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
