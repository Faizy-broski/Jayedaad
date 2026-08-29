import { Reveal } from "@/components/Reveal";

const STATS = [
  { id: "properties", value: "12,400+", label: "Verified Listings" },
  { id: "transacted", value: "Rs 48 B+", label: "Transacted Value" },
  { id: "satisfaction", value: "96%", label: "Client Retention" },
];

export function ServicesOverview() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <Reveal className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 md:gap-10 lg:gap-16">
        <div className="flex h-full flex-col justify-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            01 — Overview
          </span>
          <h2 className="mt-2 max-w-sm text-3xl font-bold leading-tight text-heading-gradient sm:text-[40px]">
            Everything you need. One trusted platform.
          </h2>
        </div>

        <div className="flex h-full max-w-2xl flex-col justify-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Jayedaad simplifies the complete property journey. Whether
            you&apos;re acquiring your first home, listing a family estate,
            sourcing tenants, or building a diversified portfolio — a single
            dedicated advisor guides you through discovery, verification,
            negotiation, legal, and long-term care.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-x-4 gap-y-6 sm:mt-10 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-10">
            {STATS.map((stat, index) => (
              <Reveal
                key={stat.id}
                delay={index * 0.08}
                className="flex min-w-0 flex-col gap-1"
              >
                <span className="text-primary text-xl font-bold sm:text-3xl lg:text-4xl">
                  {stat.value}
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
