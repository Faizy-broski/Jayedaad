import { Reveal } from "@/components/Reveal";

const STATS = [
  { id: "properties", value: "12,400+", label: "Verified Listings" },
  { id: "transacted", value: "Rs 48 B+", label: "Transacted Value" },
  { id: "satisfaction", value: "96%", label: "Client Retention" },
];

export function ServicesOverview() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            01 — Overview
          </span>
          <h2 className="mt-2 max-w-sm text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
            Everything you need. One trusted platform.
          </h2>
        </div>

        <div className="max-w-2xl">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Jayedaad simplifies the complete property journey. Whether
            you&apos;re acquiring your first home, listing a family estate,
            sourcing tenants, or building a diversified portfolio — a single
            dedicated advisor guides you through discovery, verification,
            negotiation, legal, and long-term care.
          </p>
          <div className="mt-10 flex flex-wrap justify-between items-start gap-x-10 gap-y-6">
            {STATS.map((stat, index) => (
              <Reveal
                key={stat.id}
                delay={index * 0.08}
                className="flex flex-col gap-1"
              >
                <span className="text-gradient-emerald text-3xl font-bold sm:text-4xl">
                  {stat.value}
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
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
