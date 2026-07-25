import '@testing-library/jest-dom/vitest';

// jsdom has no IntersectionObserver — framer-motion's `whileInView` (used by
// components/Reveal.tsx) needs one to exist to mount at all.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error — test-environment polyfill, not a spec-complete implementation
globalThis.IntersectionObserver = MockIntersectionObserver;
