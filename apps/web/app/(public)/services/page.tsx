import { PageHero } from "@/components/shared/PageHero";
import { TrustBanner } from "@/components/shared/TrustBanner";
import { ServicesOverview } from "@/components/services/ServicesOverview";
import { FeaturedServicesList } from "@/components/services/FeaturedServicesList";
import { OurPromise } from "@/components/services/OurPromise";
import { MarketInsights } from "@/components/landing/article/MarketInsights";
import React from "react";

const page = () => {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title={"Property journey.\nTrusted partner."}
        description="Whether buying your first home or managing an investment portfolio, Jayedaad delivers every real estate service with trusted support."
        backgroundImage="/images/about-us/about-us-hero.jpg"
      />

      <ServicesOverview />
      <FeaturedServicesList />
      <TrustBanner />
      <OurPromise />
      <MarketInsights />
    </>
  );
};

export default page;
