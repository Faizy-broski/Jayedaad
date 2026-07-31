import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', '../../packages/ui-web/src/**/*.{ts,tsx}'],
  // 'class' (not 'media') — a manual toggle now drives dark mode (see
  // apps/web/components/ThemeProvider.tsx), not just OS preference. The
  // .dark class is stamped on <html> by that provider.
  darkMode: 'class',
  theme: {
    extend: {
      // Wires Tailwind's `font-sans` (applied to <body> in app/layout.tsx)
      // to the Plus_Jakarta_Sans variable exposed there via next/font —
      // without this, `font-sans` silently falls back to Tailwind's default
      // system-font stack even though the variable is set on <html>.
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
        // Confirmed brand colors — bg-highlight for the "Super" title/promo
        // accent, bg-brand-dark for dark CTA banners/"Where we live"-style
        // sections spliced into an otherwise light page.
        highlight: {
          DEFAULT: 'hsl(var(--highlight) / <alpha-value>)',
          foreground: 'hsl(var(--highlight-foreground) / <alpha-value>)',
        },
        'brand-dark': {
          DEFAULT: 'hsl(var(--brand-dark) / <alpha-value>)',
          foreground: 'hsl(var(--brand-dark-foreground) / <alpha-value>)',
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
      // Real gradient backgrounds — not expressible via the CSS-variable
      // `hsl(var(--x) / <alpha-value>)` mechanism above (a gradient isn't a
      // single color), so these are a separate backgroundImage utility,
      // applied only where a background-image is valid (buttons), while
      // --primary/--ring etc. stay solid colors for text/border/focus-ring use.
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #0D634B 0%, #034B37 100%)',
        'gold-gradient': 'linear-gradient(111.53deg, #EBBD57 0%, #AD7B3D 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
