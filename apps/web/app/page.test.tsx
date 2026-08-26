import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './page';

// HomePage's tree (PropertySearchBar -> useTaxonomyViewModel, and others)
// calls react-query hooks, which throw without a real QueryClientProvider
// ancestor — this app's own one lives in app/providers.tsx, but that also
// initializes the Supabase client from env vars real tests shouldn't depend
// on, so a plain client scoped to this test is used instead.
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('HomePage', () => {
  // Hero.tsx renders a background photo + h1/tagline overlay (no wordmark
  // image any more), and renders BOTH a desktop and a mobile variant
  // unconditionally (Tailwind's `hidden`/`lg:block` never actually hides
  // anything in jsdom, since no stylesheet is applied), so this asserts on
  // "at least one" heading rather than a unique node.
  it('renders the hero heading', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getAllByRole('heading', { name: /find your perfect/i }).length).toBeGreaterThan(0);
  });
});
