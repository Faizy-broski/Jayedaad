'use client';

import { FormEvent, Suspense, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Home } from 'lucide-react';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Checkbox, Input, Label } from '@jayedaad/ui-web';
import { makeSessionOnlyIfNotRemembered } from '@/lib/rememberMe';

// Where a successfully-authenticated user lands when they didn't arrive via
// a redirect from a protected route (see middleware.ts's redirectTo param).
// Mirrors the same role set enforced there.
const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/admin/dashboard',
  verification_staff: '/verification',
  agent: '/dashboard',
  owner: '/submit',
  buyer: '/search',
};

// Split-screen layout: full-bleed hero image + welcome copy on the left
// (hidden below lg, since there's no room for it on mobile), clean
// pill-styled sign-in form on the right. Replaces the previous
// centered-Card layout.
//
// Wrapped in Suspense: Next.js requires any component calling
// useSearchParams() to have a Suspense boundary above it, otherwise
// `next build` opts the whole route out of static rendering with a warning.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, refetchEmailVerified } = useAuthViewModel();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  // Covers the whole submit flow, not just signIn.isPending — without this,
  // the button flips back to its idle "Sign in" label the instant the auth
  // call resolves, then goes dead again for the refetchEmailVerified() +
  // router.push() beat that follows, reading as an unresponsive click.
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setRedirecting(true);
    try {
      const { user } = await signIn.mutateAsync({ email, password });
      makeSessionOnlyIfNotRemembered(rememberMe);
      const { data: emailVerified } = await refetchEmailVerified();
      if (!emailVerified) {
        router.push('/verify-email');
        return;
      }
      const redirectTo = searchParams.get('redirectTo');
      const role = user?.app_metadata?.role as string | undefined;
      router.push(redirectTo || DEFAULT_LANDING_BY_ROLE[role ?? ''] || '/');
    } catch {
      setRedirecting(false);
    }
  }

  function handleGoogle() {
    // Left blank (not '/') when there's no explicit redirectTo — the
    // callback route falls back to a role-based landing once it knows who
    // signed in, same as handleSubmit's redirectTo || DEFAULT_LANDING_BY_ROLE
    // above, just resolved server-side since Google's round-trip means the
    // role isn't known yet at this point.
    const redirectTo = searchParams.get('redirectTo');
    const query = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : '';
    signInWithGoogle.mutate(`${window.location.origin}/auth/callback${query}`);
  }

  // TODO: wire up once an Apple OAuth mutation exists on useAuthViewModel
  // (e.g. signInWithApple), mirroring handleGoogle's redirect flow.
  function handleApple() {
    console.warn('Apple sign-in is not yet implemented.');
  }

  return (
    <main className="relative grid h-screen overflow-hidden lg:grid-cols-2">
      {/* Escape hatch back to the marketing site — AppChrome deliberately
          omits Header/Footer on this route (see AppChrome.tsx), so this is
          the only way back without hitting the browser back button. */}
      <Link
        href="/"
        className="absolute right-6 top-6 z-20 flex items-center gap-1.5 rounded-full border border-input bg-white/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur hover:bg-white"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>

      {/* Left: hero image + welcome copy — hidden on mobile/tablet */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/images/login-bg.png"
          alt="A curated Jayedaad home overlooking the coast"
          fill
          priority
          className="object-cover"
        />
        {/* Bottom-weighted scrim so the white overlay text stays readable
            against whatever's in the photo, without darkening the top. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Logo */}
        <div className="absolute left-8 top-8 flex items-center gap-2 text-white">
          <span className="text-xl font-bold tracking-wide">JAYEDAAD</span>
        </div>

        {/* Welcome copy */}
        <div className="absolute inset-x-0 bottom-0 space-y-4 p-10">
          <span className="eyebrow-label text-white/70">A curated welcome</span>
          <h1 className="heading-display leading-[1.1] text-white">
            Welcome back.
            <br />
            Find the place you&apos;ll call home.
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-3">
              {['/images/auth/avatar-1.jpg', '/images/auth/avatar-2.jpg', '/images/auth/avatar-3.jpg'].map(
                (src, i) => (
                  <div key={src} className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white">
                    <Image src={src} alt="" fill className="object-cover" sizes="36px" />
                  </div>
                ),
              )}
            </div>
            <p className="body-text-sm text-white/80">
              Trusted by discerning homeowners
              <br />
              across 40+ cities worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Right: sign-in form. Centered via my-auto on the child (below), NOT
          items-center on this container — align-items centering clips the
          TOP half unreachably when a flex child overflows an overflow-y-auto
          parent (scrollTop can't go negative). margin:auto centering doesn't
          have that bug: it collapses to 0 instead of clipping. overflow-y-
          auto itself is a fallback for very short viewports. */}
      <div className="flex justify-center overflow-y-auto px-6 py-10 sm:px-12">
        <div className="my-auto w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <span className="eyebrow-label text-muted-foreground">Sign in</span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Good to see you again.</h2>
            <p className="body-text text-muted-foreground">
              Enter your details to continue exploring your saved homes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="eyebrow-label text-muted-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@jayedaad.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-full border-input px-5"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="eyebrow-label text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-full border-input px-5 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {signIn.isError && <p className="text-sm text-destructive">Incorrect email or password.</p>}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
              <a href="/forgot-password" className="font-medium text-foreground hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={redirecting}
              className="bg-heading-gradient h-12 w-full rounded-full text-base font-semibold text-primary-foreground hover:opacity-90"
            >
              {redirecting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {signIn.isPending ? 'Signing in…' : 'Redirecting…'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="eyebrow-label whitespace-nowrap text-muted-foreground">Or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={signInWithGoogle.isPending || redirecting}
              onClick={handleGoogle}
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-input text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              {signInWithGoogle.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-foreground" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              Google
            </button>
            <button
              type="button"
              disabled={redirecting}
              onClick={handleApple}
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-input text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <AppleIcon className="h-4 w-4" />
              Apple
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New to Jayedaad?{' '}
            <a href="/signup" className="font-medium text-foreground underline underline-offset-2">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.36 1.4c.09 1.1-.32 2.13-1.02 2.9-.72.79-1.9 1.4-3 1.32-.11-1.06.36-2.16 1.03-2.87.75-.8 2.03-1.4 2.99-1.35zM20.2 17.02c-.53 1.22-.78 1.76-1.46 2.83-.95 1.5-2.29 3.37-3.95 3.39-1.48.02-1.86-.97-3.87-.96-2 .01-2.42.98-3.9.96-1.66-.02-2.93-1.7-3.88-3.2C1 16.6.68 12.7 2.02 10.62c.95-1.48 2.46-2.34 3.87-2.34 1.44 0 2.34.97 3.53.97 1.15 0 1.85-.97 3.53-.97 1.26 0 2.6.68 3.55 1.86-3.12 1.71-2.61 6.16.7 6.88z" />
    </svg>
  );
}