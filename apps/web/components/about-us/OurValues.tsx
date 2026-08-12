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
      <div className="relative flex aspect-[4/3] w-full flex-col justify-between overflow-hidden rounded-[26px] bg-[#011B14] p-6 sm:aspect-[714/587] sm:p-9">
        {image && (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 640px) 60vw, 90vw"
            className="object-contain object-right"
          />
        )}
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-56 w-56 rounded-full bg-[#0D634B]/30 blur-3xl sm:h-80 sm:w-80" />
        <span className="relative z-10 text-xs font-semibold uppercase tracking-[0.19em] text-white/50">
          {label}
        </span>
        <p className="relative z-10 max-w-sm text-2xl font-semibold leading-[1.15] text-white sm:text-[45px] sm:leading-[1.15]">
          {renderTitle(title)}
        </p>
      </div>
    );
  }

  if (size === 'lg-photo') {
    return (
      <div className="relative flex aspect-[4/5] w-full flex-col justify-end overflow-hidden rounded-[26px] p-6 sm:aspect-[504/587] sm:p-9">
        {image && <Image src={image} alt="" fill sizes="(min-width: 640px) 40vw, 90vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="relative z-10 text-xs font-medium uppercase tracking-[0.19em] text-white/80">{label}</span>
        <p className="relative z-10 mt-2 max-w-sm text-base font-medium leading-snug text-white sm:text-xl sm:leading-tight">
          {title}
        </p>
      </div>
    );
  }

  if (size === 'sm-photo') {
    return (
      <div className="relative flex aspect-[4/3] w-full flex-col justify-end overflow-hidden rounded-[26px] p-5 sm:aspect-[398/332] sm:p-7">
        {image && (
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 90vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-black/25" />
        <span className="relative z-10 text-xs font-medium uppercase tracking-[0.19em] text-white/80">{label}</span>
        <p className="relative z-10 mt-1 text-sm font-medium leading-snug text-white sm:text-base sm:leading-snug">
          {title}
        </p>
      </div>
    );
  }

  if (size === 'sm-accent') {
    return (
      <div className="flex aspect-[16/9] w-full flex-col justify-between rounded-[26px] bg-[#259F56] p-5 sm:aspect-[398/332] sm:p-7">
        <span className="text-xs font-medium uppercase tracking-[0.19em] text-white/80">{label}</span>
        <p className="max-w-xs text-base font-medium leading-snug text-white sm:text-xl sm:leading-tight">{title}</p>
      </div>
    );
  }

  if (size === 'wide-light') {
    return (
      <div className="flex aspect-[16/9] w-full flex-col gap-2 rounded-[26px] border border-[#E6E8EA] bg-white p-6 sm:aspect-[504/207] sm:p-9">
        <span className="text-xs font-medium uppercase tracking-[0.19em] text-[#212730]/80">{label}</span>
        <p className="text-base font-medium leading-snug text-[#212730] sm:text-lg sm:leading-snug">{title}</p>
      </div>
    );
  }

  if (size === 'md-light') {
    return (
      <div className="flex aspect-[16/9] w-full flex-col gap-3 rounded-[26px] bg-white p-5 sm:aspect-[398/207] sm:p-7">
        <span className="text-xs font-medium uppercase tracking-[0.19em] text-[#212730]/80">{label}</span>
        <p className="text-sm font-medium leading-snug text-[#212730] sm:text-base sm:leading-snug">{title}</p>
      </div>
    );
  }

  if (size === 'sm-light') {
    return (
      <div className="flex aspect-[4/3] w-full flex-col gap-3 rounded-[26px] border border-[#E6E8EA] bg-white p-5 sm:aspect-[398/332] sm:p-7">
        <span className="text-xs font-medium uppercase tracking-[0.19em] text-[#212730]/80">{label}</span>
        <p className="text-sm font-medium leading-snug text-[#212730] sm:text-base sm:leading-snug">{title}</p>
        {description && <p className="text-xs font-light leading-snug text-[#212730]/60">{description}</p>}
      </div>
    );
  }

  return (
    <div className="flex aspect-[16/9] w-full flex-col justify-center gap-6 rounded-[26px] border border-[#212730]/15 p-5 sm:aspect-[293/207] sm:p-7">
      <span className="text-xs font-medium uppercase tracking-[0.19em] text-[#212730]/80">{label}</span>
      <p className="text-sm font-medium leading-snug text-[#212730] sm:text-base sm:leading-snug">{title}</p>
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
            03 — Our Values
          </span>
          <h2 className="mt-2 max-w-md text-3xl font-bold leading-tight text-heading-gradient sm:text-4xl">
            What we hold, we hold precisely.
          </h2>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-12 sm:gap-6">
          <Reveal delay={0} className="sm:col-span-7">
            <ValueCard value={large1} />
          </Reveal>
          <Reveal delay={0.08} className="sm:col-span-5">
            <ValueCard value={large2} />
          </Reveal>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:mt-6 sm:grid-cols-3 sm:gap-6">
          {row2.map((value, index) => (
            <Reveal key={value.id} delay={index * 0.08} className={index === 2 ? 'xs:col-span-2 sm:col-span-1' : undefined}>
              <ValueCard value={value} />
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-12 sm:gap-6">
          <Reveal delay={0} className="sm:col-span-5">
            <ValueCard value={row3[0]} />
          </Reveal>
          <Reveal delay={0.08} className="sm:col-span-4">
            <ValueCard value={row3[1]} />
          </Reveal>
          <Reveal delay={0.16} className="sm:col-span-3">
            <ValueCard value={row3[2]} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
