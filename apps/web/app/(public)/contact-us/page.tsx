import { ConsultationSection } from "@/components/contact-us/Consultation";
import { OfficeShowcaseSection } from "@/components/contact-us/OfficeShowCase";
import { HowCanWeHelp } from "@/components/contact-us/HowCanWeHelp";
import { FollowJourney } from "@/components/contact-us/FollowJourney";
import { PageHero } from "@/components/shared/PageHero";
import React from "react";

const page = () => {
  return (
    <>
      <PageHero
        eyebrow="Contact Jayedaad"
        title={"Let's find your\nnext address"}
        description="Whether you're buying, selling, investing, or simply exploring — our property experts are here to guide you every step of the way."
        backgroundImage="/images/contact-us/contact-us-hero.jpg"
      />

      <ConsultationSection />
      <OfficeShowcaseSection />
      <HowCanWeHelp />
      <FollowJourney />
    </>
  );
};

export default page;
