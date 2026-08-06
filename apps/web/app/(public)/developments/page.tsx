import { Suspense } from 'react';
import { SearchHero } from '@/components/shared/SearchHero';
import { ProjectsBrowserSection } from '@/components/projects-detail/ProjectsBrowserSection';

export default function DevelopmentsPage() {
  return (
    <main>
      <SearchHero
        eyebrow="New Projects"
        title="Discover Pakistan's next great developments"
        backgroundImage="/images/about-us/about-us-hero.jpg"
        defaultPurpose="buy"
      />

      {/* ProjectsBrowserSection reads ?city= via useSearchParams(), which
          requires a Suspense boundary in the app router. */}
      <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Loading projects…</div>}>
        <ProjectsBrowserSection />
      </Suspense>
    </main>
  );
}
