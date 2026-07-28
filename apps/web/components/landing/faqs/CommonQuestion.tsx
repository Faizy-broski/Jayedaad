import Image from "next/image";
import { FAQAccordion } from "./FaqAccordion";
import { FAQS } from "@/data/faqs";
import { Reveal } from "@/components/Reveal";

export function CommonQuestions() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      {/* Faint centered building watermark, same treatment as the other
          bg-image sections — very low opacity so it never competes with the
          accordion text sitting on top of it. */}

      <div className="pointer-events-none absolute inset-x-0 top-0 left-1/3 h-[100%] max-w-4xl">
        <Image
          src="/images/faqs-bg.png"
          alt=""
          fill sizes="100vw"
          className="object-cover object-right-top"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-widest text-eyebrow-gradient">
            FAQ
          </span>
          <h2 className="mt-2 text-3xl font-bold text-heading-gradient sm:text-4xl">
            Common questions
          </h2>
        </Reveal>
      </div>

      <div className="relative z-10 mx-auto mt-10 max-w-2xl px-4">
        <Reveal delay={0.15}>
          <FAQAccordion faqs={FAQS} />
        </Reveal>
      </div>
    </section>
  );
}
