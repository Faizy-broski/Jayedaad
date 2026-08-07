import Image from "next/image";
import { PageHero } from "@/components/shared/PageHero";
import { OurStory } from "@/components/about-us/OurStory";
import { OurValues } from "@/components/about-us/OurValues";
import { OurProcess } from "@/components/about-us/OurProcess";
import { TrustBanner } from "@/components/shared/TrustBanner";
import { FeaturedLocationsSection } from "@/components/about-us/FeaturedLocationSection";
import { RealStories } from "@/components/landing/testimonials/RealStories";
import { TESTIMONIALS } from "@/data/testimonials";
import React from "react";

const page = () => {
  return (
    <>
      <PageHero
        eyebrow="About Jayedaad"
        title={"Building trust for every home"}
        description="Jayedaad is redefining the real estate experience in Pakistan through
verified listings, trusted professionals and intelligent technology."
        backgroundImage="/images/about-us/about-us-hero.jpg"
      />

      <OurStory />
      <OurValues />
      <OurProcess />
      <TrustBanner />

      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-x-0 -bottom-28 left-1/6 h-full opacity-70">
          <Image src="/images/about-bg.png" alt="" fill sizes="100vw" className="object-contain object-center" />
        </div>

       <FeaturedLocationsSection embedded />
        <RealStories testimonials={TESTIMONIALS} embedded />
      </section>
    </>
  );
};

export default page;
