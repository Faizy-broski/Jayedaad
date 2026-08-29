import { Suspense } from 'react';
import { SearchHero } from '@/components/shared/SearchHero';
import { AgenciesBrowserSection } from '@/components/agencies/AgenciesBrowserSection';

export default function AgentsPage() {
  return (
    <main>
      <SearchHero
        eyebrow="Agents"
        title="Find a trusted agency"
        backgroundImage="/images/about-us/about-us-hero.jpg"
        variant="agencies"
      />

      {/* AgenciesBrowserSection reads ?city=/?location=/?propertyTypeSlug=/
          ?search=/?tier= via useSearchParams(), which requires a Suspense
          boundary in the app router. */}
      <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading agencies…</div>}>
        <AgenciesBrowserSection />
      </Suspense>
    </main>
  );
}
