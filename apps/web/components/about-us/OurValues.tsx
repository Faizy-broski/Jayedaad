import Image from 'next/image';
import { Reveal } from '@/components/Reveal';
import { ABOUT_VALUES, type AboutValue } from '@/data/aboutValues';

function renderTitle(title: string) {
  return title.split('_').map((part, index) =>
    index % 2 === 1 ? <em key={index} className="italic">{part}</em> : part,
  );
}

function ValueCard({ value }: { value: AboutValue }) {
  const { size, label, title, description, image } = value;

  if (size === 'lg-dark') {
    return (
      <div className="relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-3xl bg-brand-dark/90 p-7 sm:min-h-[580px]">
        {image && (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 640px) 45vw, 90vw"
            className="object-contain object-right mix-blend-luminosity"
          />
        )}
        {/* <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-brand-dark/40" /> */}
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />

        <span className="relative z-10 text-[11px] font-semibold uppercase tracking-widest text-white/50">
          {label}
        </span>
        <p className="relative z-10 text-2xl font-semibold leading-snug text-white sm:text-3xl">
          {renderTitle(title)}
        </p>
      </div>
    );
  }

  if (size === 'lg-photo') {
    return (
      <div className="relative flex h-full min-h-[220px] flex-col justify-end overflow-hidden rounded-3xl p-7 sm:min-h-[580px]">
        {image && (
          <Image src={image} alt="" fill sizes="(min-width: 640px) 45vw, 90vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <span className="relative z-10 text-[11px] font-semibold uppercase tracking-widest text-white/70">
          {label}
        </span>
        <p className="relative z-10 mt-1 text-xl font-semibold leading-snug text-white sm:text-2xl">{title}</p>
      </div>
    );
  }

  if (size === 'sm-photo') {
    return (
      <div className="relative flex h-full min-h-[260px] flex-col justify-end overflow-hidden rounded-2xl p-5">
        {image && (
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <span className="relative z-10 text-[10px] font-semibold uppercase tracking-widest text-white/70">
          {label}
        </span>
        <p className="relative z-10 mt-1 text-sm font-semibold leading-snug text-white">{title}</p>
      </div>
    );
  }

  if (size === 'sm-accent') {
    return (
      <div className="flex h-full min-h-[160px] flex-col justify-between rounded-2xl bg-heading-gradient p-5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
          {label}
        </span>
        <p className="text-sm font-semibold leading-snug text-primary-foreground">{title}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[160px] flex-col justify-between rounded-2xl bg-white p-5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <div>
        <p className="text-sm font-semibold leading-snug text-slate-900">{title}</p>
        {description && <p className="mt-1 text-xs leading-snug text-slate-400">{description}</p>}
      </div>
    </div>
  );
}

export function OurValues() {
  const [large1, large2, ...rest] = ABOUT_VALUES;
  const row2 = rest.slice(0, 3);
  const row3 = rest.slice(3, 6);

  return (
    <section className="bg-[#F2F3F5] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            02 — Our Values
          </span>
          <h2 className="mt-2 max-w-md text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
            What we hold, we hold precisely.
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-5">
          <Reveal delay={0} className="sm:col-span-3">
            <ValueCard value={large1} />
          </Reveal>
          <Reveal delay={0.08} className="sm:col-span-2">
            <ValueCard value={large2} />
          </Reveal>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {row2.map((value, index) => (
            <Reveal key={value.id} delay={index * 0.08}>
              <ValueCard value={value} />
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {row3.map((value, index) => (
            <Reveal key={value.id} delay={index * 0.08}>
              <ValueCard value={value} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
