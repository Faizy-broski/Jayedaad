import { Hero } from '../components/landing/Hero';
import { FeaturedProperties } from '@/components/landing/features/FeaturedProperties';
import { FEATURED_PROPERTIES } from '@/data/properties';
import { BrowseByCategory } from '@/components/landing/category/BrowseByCategory';
import { CATEGORIES } from '@/data/categories';
import { AboutSection } from '@/components/landing/about/AboutSection';
import { WhereWeLive } from '@/components/landing/city/WhereWeLive';
import { CITIES } from '@/data/cities';
import { ServicesAndProjects } from '@/components/landing/services/ServicesAndProjects';
import { NewlyStaged } from '@/components/landing/newlystaged/NewlyStaged';
import { NEWLY_STAGED_PROPERTIES } from '@/data/newlyStaged';
import { MarketInsights } from '@/components/landing/article/MarketInsights';
import { HowItWorks } from '@/components/landing/howitworks/HowItWorks';
import { RealStories } from '@/components/landing/testimonials/RealStories';
import { TESTIMONIALS } from '@/data/testimonials';
import { CommonQuestions } from '@/components/landing/faqs/CommonQuestion';
import { AppPromo } from '@/components/landing/AppPromo';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <BrowseByCategory categories={CATEGORIES} />
      <FeaturedProperties properties={FEATURED_PROPERTIES} />
      <AboutSection />
      <WhereWeLive cities={CITIES} />
      <ServicesAndProjects />
      <NewlyStaged properties={NEWLY_STAGED_PROPERTIES} />
      <HowItWorks />
      <RealStories testimonials={TESTIMONIALS} />
      <CommonQuestions />
      <AppPromo />
      <MarketInsights />
    </main>
  );
}
