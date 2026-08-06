import { Hero } from '../components/landing/Hero';
import { FeaturedPropertiesSection } from '@/components/landing/features/FeaturedPropertiesSection';
import { BrowseByCategorySection } from '@/components/landing/category/BrowseByCategorySection';
import { AboutSection } from '@/components/landing/about/AboutSection';
import { WhereWeLiveSection } from '@/components/landing/city/WhereWeLiveSection';
import { ServicesAndProjects } from '@/components/landing/services/ServicesAndProjects';
import { NewProjectsSection } from '@/components/landing/newprojects/NewProjectsSection';
import { MarketInsights } from '@/components/landing/article/MarketInsights';
import { ARTICLES } from '@/data/articles';
import { HowItWorks } from '@/components/landing/howitworks/HowItWorks';
import { RealStories } from '@/components/landing/testimonials/RealStories';
import { TESTIMONIALS } from '@/data/testimonials';
import { CommonQuestions } from '@/components/landing/faqs/CommonQuestion';
import { AppPromo } from '@/components/landing/AppPromo';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <BrowseByCategorySection />
      <FeaturedPropertiesSection />
      <AboutSection />
      <WhereWeLiveSection />
      <ServicesAndProjects />
      <NewProjectsSection />
      <HowItWorks />
      <RealStories testimonials={TESTIMONIALS} />
      <CommonQuestions />
      <AppPromo />
      <MarketInsights articles={ARTICLES} />
    </main>
  );
}
