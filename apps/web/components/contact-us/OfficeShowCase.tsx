import Image from "next/image";
import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";

interface InfoRow {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
}

const INFO_ROWS: InfoRow[] = [
  {
    icon: MapPin,
    label: "Address",
    value: "12-A Main Boulevard, Gulberg III, Lahore",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon–Sat · 9:00 – 20:00",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+92 42 111 000 111",
    href: "tel:+9242111000111",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@jayedaad.com",
    href: "mailto:hello@jayedaad.com",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+92 300 000 0000",
    href: "https://wa.me/923000000000",
  },
];

export function OfficeShowcaseSection() {
  return (
    <section className="w-full">
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* OFFICE IMAGE */}
        <div
          className="
            relative
            h-[260px]
            w-full
            overflow-hidden
            rounded-2xl
            sm:h-[380px]
            sm:rounded-3xl
            md:h-[480px]
            lg:h-[600px]
            xl:h-[650px]
          "
        >
          <Image
            src="/images/contact-us/jayedaad-office.jpg"
            alt="Jayedaad House — head office exterior, Gulberg III, Lahore"
            fill
            priority
            sizes="
              (min-width: 1280px) 1200px,
              (min-width: 1024px) 90vw,
              (min-width: 640px) 92vw,
              100vw
            "
            className="object-cover object-center"
          />

          {/* Subtle overlay for better contrast on larger screens */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>

        {/* INFO CARD */}
        <div
          className="
            relative
            z-10

            -mt-8
            mx-3

            rounded-2xl
            border
            border-white/70
            bg-white/95
            p-5
            shadow-xl
            backdrop-blur-md

            sm:-mt-10
            sm:mx-6
            sm:rounded-3xl
            sm:p-6

            md:-mt-16
            md:mx-10
            md:p-7

            lg:absolute
            lg:right-12
            lg:top-1/2
            lg:bottom-auto
            lg:mt-0
            lg:mx-0
            lg:w-[380px]
            lg:-translate-y-1/2
            lg:p-8

            xl:right-16
            xl:w-[420px]
            xl:p-9
          "
        >
          {/* HEADER */}
          <div>
            <span
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-slate-500
                sm:text-[11px]
              "
            >
              Head office
            </span>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                leading-[1.15]
                text-heading-gradient

                sm:mt-3
                sm:text-3xl

                lg:text-4xl
              "
            >
              Jayedaad House,
              <br />
              Lahore.
            </h2>
          </div>

          {/* INFORMATION */}
          <dl
            className="
              mt-6
              grid
              grid-cols-1
              gap-4

              sm:mt-7
              sm:gap-5

              md:grid-cols-2
              md:gap-x-6
              md:gap-y-5

              lg:grid-cols-1
              lg:gap-5
            "
          >
            {INFO_ROWS.map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                className="flex min-w-0 items-start gap-3"
              >
                {/* ICON */}
                <span
                  className="
                    mt-0.5
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-primary/10
                    text-primary

                    sm:h-9
                    sm:w-9
                  "
                >
                  <Icon className="h-4 w-4" />
                </span>

                {/* CONTENT */}
                <div className="min-w-0 flex-1">
                  <dt
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.16em]
                      text-slate-500

                      sm:text-[10px]
                      sm:tracking-widest
                    "
                  >
                    {label}
                  </dt>

                  {href ? (
                    <dd
                      className="
                        mt-1
                        break-words
                        text-xs
                        font-medium
                        leading-snug
                        text-slate-800

                        sm:text-sm
                      "
                    >
                      <a
                        href={href}
                        className="transition-colors hover:text-primary"
                      >
                        {value}
                      </a>
                    </dd>
                  ) : (
                    <dd
                      className="
                        mt-1
                        break-words
                        text-xs
                        font-medium
                        leading-snug
                        text-slate-800

                        sm:text-sm
                      "
                    >
                      {value}
                    </dd>
                  )}
                </div>
              </div>
            ))}
          </dl>

          {/* DIRECTIONS BUTTON */}
          <a
            href="https://maps.google.com/?q=12-A+Main+Boulevard,+Gulberg+III,+Lahore"
            target="_blank"
            rel="noopener noreferrer"
            className="
              mt-6
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-full
              bg-heading-gradient
              px-5
              py-3
              text-xs
              font-medium
              text-white
              shadow-lg
              shadow-primary/20
              transition-opacity
              hover:opacity-90

              sm:mt-7
              sm:px-6
              sm:py-3.5
              sm:text-sm

              lg:mt-8
            "
          >
            <Navigation className="h-4 w-4 shrink-0" />
            <span>Get directions</span>
          </a>
        </div>
      </div>
    </section>
  );
}