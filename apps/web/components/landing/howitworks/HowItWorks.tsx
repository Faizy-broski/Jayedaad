import Image from "next/image";
import { HOW_IT_WORKS_STEPS } from "@/data/howItWorks";
import { StepCard } from "./StepCard";
import { Reveal } from "@/components/Reveal";

// Card positions are hand-placed (not derived from a grid) since each one
// anchors to a specific spot around the house photo, matching the reference
// layout exactly. Pull the step by id rather than looping, since each
// position needs different inset/translate values.
const stepById = Object.fromEntries(
  HOW_IT_WORKS_STEPS.map((step) => [step.id, step]),
);

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      {/* Background layer: faint "subtract" shape centered, plus the wordmark
          logo mirrored large and faint on both far edges. */}
      <div className="pointer-events-none absolute inset-0 lg:flex hidden items-center justify-between">
        <Image
          src="/images/logo-left.png"
          alt=""
          width={420}
          height={120}
          className="h-auto w-[280px] shrink-0 sm:w-[480px]"
        />
        <Image
          src="/images/logo-right.png"
          alt=""
          width={420}
          height={120}
          className="h-auto w-[280px] shrink-0 sm:w-[480px]"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 lg:flex hidden items-center justify-center">
        <Image
          src="/images/subtract.png"
          alt=""
          width={900}
          height={900}
          className="h-auto w-[85%] max-w-3xl object-contain"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            How It Works
          </span>
          <h2 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">
            Four steps to your keys
          </h2>
        </Reveal>

        {/* Desktop / tablet: house centered with 4 cards + connecting arc
            positioned absolutely around it. Below lg, this collapses to a
            simple stacked list since absolute anchoring around a shrinking
            image breaks down at narrow widths. */}
        <div className="relative mt-14 hidden lg:block">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-xl">
            <Image
              src="/images/how-it-works-house.png"
              alt="Modern two-storey house"
              fill
              sizes="576px"
              className="object-contain"
            />
          </div>

          <div className="absolute left-0 bottom-16 xl:left-8">
            <Reveal delay={0}>
              <StepCard step={stepById.search} />
            </Reveal>
          </div>
          <div className="absolute left-4 top-0 xl:left-36">
            <Reveal delay={0.1}>
              <StepCard step={stepById.visit} />
            </Reveal>
          </div>
          <div className="absolute right-4 top-0 xl:right-36">
            <Reveal delay={0.2}>
              <StepCard step={stepById.verify} />
            </Reveal>
          </div>
          <div className="absolute right-0 bottom-16 xl:right-8">
            <Reveal delay={0.3}>
              <StepCard step={stepById.own} />
            </Reveal>
          </div>
        </div>

        {/* Mobile / tablet fallback: house up top, steps stacked in order below. */}
        <div className="mt-10 lg:hidden">
          <div className="relative mx-auto lg:aspect-[4/3] w-full max-w-sm">
            <Image
              src="/images/how-it-works-house.png"
              alt="Modern two-storey house"
              fill
              sizes="384px"
              className="object-contain"
            />
          </div>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 0.08}>
                <StepCard step={step} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
