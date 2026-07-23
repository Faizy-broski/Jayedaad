# @jayedaad/web

The Next.js 14 (App Router) web app — buyer/owner-facing pages plus the agent/admin portals. This doc is the map for anyone (including future-you) picking this codebase up for the first time.

## Architecture — MVVM / Clean Architecture

This is not a standalone Next.js app with its own business logic. Per `Jayedaad_Architectural_Blueprint.md` §2, this repo is a monorepo split so **web and mobile share everything except the View layer**:

```
apps/web            View only — pages, layout, routing, Tailwind markup
packages/core        Models, ViewModels (hooks), Services (API calls), State — platform-agnostic
packages/ui-web      Presentational components only (Tailwind + shadcn-pattern)
services/api         NestJS backend (separate concern, not covered here)
```

**The one rule that matters most:** files under `apps/web/app/**` and `apps/web/components/**` must never call `fetch`/`axios`, never import `@supabase/supabase-js` directly, and never hold business logic. They call a `use*ViewModel()` hook from `@jayedaad/core` and render the result. This is **enforced by ESLint** (`.eslintrc.json`'s `no-restricted-imports`), not just a convention — if you try to `import axios` in a page, lint fails.

Why: `apps/mobile` calls the exact same viewmodels with the exact same params and gets the exact same shape back — only the JSX/styling differs. That's what makes web/mobile feature parity a checked property instead of an aspiration.

## Folder structure

```
apps/web/
├── app/                      # Routes (Next.js App Router)
│   ├── (auth)/login/         # Route group: unauthenticated
│   ├── (buyer)/search/       # Route group: public
│   ├── (owner)/submit/       # Route group: role-gated (owner/agent/super_admin)
│   ├── (agent)/crm/          # Route group: role-gated (agent/super_admin)
│   ├── (admin)/verification/ # Route group: role-gated (verification_staff/super_admin)
│   ├── layout.tsx            # Root layout — wraps everything in <Providers>
│   ├── providers.tsx         # Configures @jayedaad/core (Supabase client, httpClient, React Query)
│   ├── error.tsx             # Root error boundary
│   └── globals.css           # Tailwind + design-token CSS variables
├── components/                # App-specific composed components (NOT generic/reusable —
│                               #   e.g. ReachOutToExperts, RouteLoading/RouteError).
│                               #   Generic, reusable presentational components belong in
│                               #   packages/ui-web instead.
├── lib/
│   └── env.ts                 # Typed, validated env var accessor — the only place that
│                               #   should read process.env.NEXT_PUBLIC_*
├── middleware.ts               # Role-based route protection (see Auth below)
├── e2e/                        # Playwright end-to-end specs
└── (config files)
```

**Route groups map to actual roles**, enforced in three places that must stay in sync if you add a new gated route: `middleware.ts`'s `PROTECTED_ROUTES`, the `app/(role)/...` folder you put the page in, and the corresponding `@Roles()` guard in `services/api` (the real source of truth — middleware is a nicer redirect, not the security boundary).

## Adding a new page

1. Pick the right route group (or add a new one if it's a genuinely new role/section).
2. If it needs data, check `packages/core/src/viewmodels/` first — there's probably already a `use*ViewModel()` hook. If not, and the feature needs a new API endpoint, that's a `services/api` + `packages/core` change (repository + viewmodel), not something to hack around from the page.
3. Write the page as a `'use client'` component calling the viewmodel and rendering with `@jayedaad/ui-web` components. Look at `app/(owner)/submit/page.tsx` or `app/(auth)/login/page.tsx` for the shape.
4. Add a `loading.tsx`/`error.tsx` in the same folder if it's a new route group (see the existing ones for the two-line pattern — they just re-export the shared `components/RouteLoading` / `components/RouteError`).
5. If it's role-gated, add it to `middleware.ts`'s `PROTECTED_ROUTES`.

## Data fetching: React Query, always through a ViewModel

Server state (listings, leads, verification queue, auth session) is **always** `@tanstack/react-query`, wrapped in a `packages/core/src/viewmodels/use*ViewModel.ts` hook. Two shapes you'll see:

```ts
// Read-only viewmodel
const { listings, isLoading } = useListingSearchViewModel(filters);

// Viewmodel with a write side — mutations are returned RAW (not wrapped),
// so you get TanStack's isPending/isError/mutate/mutateAsync directly
const { submit } = useListingSubmissionViewModel();
await submit.mutateAsync(input);
```

Don't call `useQuery`/`useMutation` directly from a page — if the hook you need doesn't exist yet in `packages/core`, add it there (see `useAuthViewModel.ts` for a recent example combining reactive state + mutations in one hook).

## Local/UI state: Zustand

Anything that isn't server data — modal open/closed, a filter draft before it's submitted, the reactive auth session — is a small Zustand store in `packages/core/src/state/`. See `useAuthStore.ts`. Not Redux (see the blueprint for why): no Provider tree, works identically on web and React Native, minimal boilerplate.

## Auth

- **Session state**: `useAuthViewModel()` from `@jayedaad/core` — returns `{ session, user, isAuthenticated, isInitializing, role, agentId, signIn, signUp, signOut }`. `signIn`/`signUp`/`signOut` are mutations (`.mutateAsync(...)`).
- **Route protection**: `middleware.ts` checks the Supabase session cookie server-side (via `@supabase/ssr`) for any path matching `PROTECTED_ROUTES`, redirects to `/login?redirectTo=...` if unauthenticated, or `/` if authenticated with the wrong role.
- **Reference implementation**: `app/(auth)/login/page.tsx`. Signup/forgot-password pages don't exist yet — copy the login page's shape (`useAuthViewModel().signUp`/a password-reset call added to `authService.ts` the same way `signInWithPassword`/`signUp`/`signOut` already are).
- The NestJS API **never issues tokens** — it only verifies the Supabase-issued JWT. Identity lives entirely in Supabase Auth, called directly from this app.

## Styling & components

Tailwind, with a shadcn/ui-style token system:

- Design tokens (`--primary`, `--background`, etc.) are CSS variables in `app/globals.css`, mapped into Tailwind's theme in `tailwind.config.ts`. **Change colors there, not by hunting down hardcoded hex/palette values in components** — every component built against `bg-primary`/`text-muted-foreground`/etc. picks up the change automatically. Confirmed brand tokens: `primary` (#07533E, main CTA green), `brand-dark` (#011B14, dark banner/section backgrounds), `highlight` (#F9AD3E–#E88742, the warm-orange "Super" title/promo accent) — use `bg-primary`, `bg-brand-dark text-brand-dark-foreground`, `text-highlight`, etc.
- `packages/ui-web` holds the actual components (`Button`, `Input`, `Textarea`, `Select`, `Label`, `Card`), built with `class-variance-authority` for variants and a shared `cn()` helper (clsx + tailwind-merge) for merging classNames without conflicts. Follow this pattern for new components rather than hand-rolling className strings.
- `Select` is a plain native `<select>` wrapper (not Radix) — deliberately, since nothing in this app needs combobox/search behavior yet. If something does, that's when to reach for a Radix-based one.
- Dark mode is OS-preference-driven (`darkMode: 'media'` in Tailwind config) — there's no manual toggle. If you add one, switch `globals.css`'s dark tokens to a `.dark` class selector and drive it from a small Zustand store.

## Environment variables

Only `NEXT_PUBLIC_*` vars belong here (server-only secrets live in `services/api`'s env, never this app's). Read them through `lib/env.ts`'s `getClientEnv()` — don't scatter `process.env.NEXT_PUBLIC_X` across files. It warns (not throws) if Supabase vars are missing, so a fresh checkout without `.env` filled in still boots.

Copy `.env.example` (repo root) to `.env` (repo root) before running `pnpm dev`.

## Testing

- **Unit/component** — Vitest + React Testing Library. `pnpm test` (or `test:watch`). Config: `vitest.config.ts`. See `app/page.test.tsx` (page-level) and `packages/ui-web/src/Button.test.tsx` (component-level) for the pattern.
- **E2E** — Playwright, against a real production build. `pnpm test:e2e` (runs `playwright test`; first time, run `npx playwright install --with-deps chromium` to fetch the browser binary). Specs live in `e2e/`. See `e2e/home.spec.ts` — it includes a smoke test that actually verifies `middleware.ts`'s redirect works, not just that pages render.
- CI (`.github/workflows/web.yml`) runs typecheck → lint → unit tests → build on every PR touching `apps/web/**` or `packages/**`. E2E is not in CI yet (it needs a running server + browser install — deliberately kept local/manual for now; add it as a separate CI job if it earns its keep).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `next lint` (includes the import-boundary rule) |
| `pnpm test` | Vitest, single run |
| `pnpm test:watch` | Vitest, watch mode |
| `pnpm test:e2e` | Playwright |

All of these also run via `turbo run <task>` from the repo root, filtered/cached per-package.
