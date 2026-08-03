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
    <section className="overflow-hidden py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* OFFICE IMAGE */}
          <div
            className="
              relative
              h-[300px]
              w-full
              overflow-hidden
              rounded-3xl

              sm:h-[420px]
              md:h-[520px]
              lg:h-[620px]
            "
          >
            <Image
              src="/images/contact-us/jayedaad-office.jpg"
              alt="Jayedaad House — head office exterior, Gulberg III, Lahore"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>

          {/* INFO CARD */}
          <div
            className="
              relative
              z-10

              -mt-12
              mx-3

              rounded-3xl
              border
              border-white/60
              bg-white/90
              p-5
              shadow-xl
              backdrop-blur-md


              /* small screens and above */
              sm:absolute
              sm:right-5
              sm:top-8
              sm:bottom-8
              sm:mt-0
              sm:mx-0
              sm:flex
              sm:w-[340px]
              sm:flex-col
              sm:justify-center
              sm:p-7


              /* desktop */
              md:w-[370px]

              lg:right-10
              lg:w-[420px]
              lg:p-9
            "
          >
            <span
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-slate-500
              "
            >
              Head office
            </span>

            <h2
              className="
                mt-3
                text-2xl
                font-bold
                leading-[1.2]
                text-heading-gradient

                sm:text-3xl
                lg:text-4xl
              "
            >
              Jayedaad House,
              <br />
              Lahore.
            </h2>

            <dl className="mt-6 flex flex-col gap-4 sm:mt-7 sm:gap-5">
              {INFO_ROWS.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className="
                        mt-1
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-primary/10
                        text-primary
                      "
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <dt
                      className="
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-widest
                          text-slate-500
                        "
                    >
                      {label}
                    </dt>

                    {href ? (
                      <dd
                        className="
                            mt-1
                            truncate
                            text-sm
                            font-medium
                            text-slate-800
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
                            text-sm
                            font-medium
                            leading-snug
                            text-slate-800
                          "
                      >
                        {value}
                      </dd>
                    )}
                  </div>
                </div>
              ))}
            </dl>

            <a
              href="https://maps.google.com/?q=12-A+Main+Boulevard,+Gulberg+III,+Lahore"
              target="_blank"
              rel="noopener noreferrer"
              className="
                mt-7
                flex
                w-full
                items-center
                justify-center
                gap-2

                rounded-full
                bg-heading-gradient

                px-6
                py-3.5

                text-sm
                font-medium
                text-white

                shadow-lg
                shadow-primary/20

                transition-opacity
                hover:opacity-90

                sm:mt-8
              "
            >
              <Navigation className="h-4 w-4" />
              Get directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
