import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Components rendered outside an actual Next.js app-router tree (e.g. this
// app's page.test.tsx renders <HomePage /> directly with RTL, not via a
// framework test harness) crash on any next/navigation hook with "invariant
// expected app router to be mounted" — PropertySearchBar's useRouter() being
// the first to hit it. Stub the hooks any component under test might call
// rather than mocking per-test, so new tests don't hit the same invariant.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
