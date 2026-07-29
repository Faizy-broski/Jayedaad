import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', '../../packages/ui-web/src/**/*.{ts,tsx}'],
  darkMode: 'media', // both light and dark modes required [Spec §8]
  theme: {
    extend: {
      // --font-sans is set by next/font/google in app/layout.tsx (Plus
      // Jakarta Sans) — falls back to the default stack if it's ever
      // unavailable (e.g. font failed to load).
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
      // Maps the CSS-variable tokens defined in app/globals.css — standard
      // shadcn/ui convention. `hsl(var(--x) / <alpha-value>)` (rather than
      // plain `hsl(var(--x))`) is what lets Tailwind's opacity modifiers
      // (e.g. bg-primary/50) work correctly.
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        // Confirmed brand colors — bg-highlight for eyebrow labels/star
        // ratings (muted sage green), bg-brand-dark for dark CTA
        // banners/"Where we live"-style sections spliced into an otherwise
        // light page, bg-brand-emerald for vivid numeric stat call-outs.
        highlight: {
          DEFAULT: 'hsl(var(--highlight) / <alpha-value>)',
          foreground: 'hsl(var(--highlight-foreground) / <alpha-value>)',
        },
        'brand-dark': {
          DEFAULT: 'hsl(var(--brand-dark) / <alpha-value>)',
          foreground: 'hsl(var(--brand-dark-foreground) / <alpha-value>)',
        },
        'brand-emerald': {
          DEFAULT: 'hsl(var(--brand-emerald) / <alpha-value>)',
          foreground: 'hsl(var(--brand-emerald-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
