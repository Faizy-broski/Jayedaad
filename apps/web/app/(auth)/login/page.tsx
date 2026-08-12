'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Checkbox, Input, Label } from '@jayedaad/ui-web';
import { makeSessionOnlyIfNotRemembered } from '@/lib/rememberMe';
import { AuthShell } from '@/components/auth/AuthShell';

// Where a successfully-authenticated user lands when they didn't arrive via
// a redirect from a protected route (see middleware.ts's redirectTo param).
// Mirrors the same role set enforced there.
const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/admin/dashboard',
  verification_staff: '/verification',
  agent: '/dashboard',
  owner: '/submit',
  buyer: '/account/saved',
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
  const { signIn, signInWithGoogle, signInWithApple, refetchEmailVerified } = useAuthViewModel();

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

  // Left blank (not '/') when there's no explicit redirectTo for both of
  // these — the callback route falls back to a role-based landing once it
  // knows who signed in, resolved server-side since the OAuth round-trip
  // means the role isn't known yet at this point.
  function oauthRedirectUrl(): string {
    const redirectTo = searchParams.get('redirectTo');
    const query = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : '';
    return `${window.location.origin}/auth/callback${query}`;
  }

  function handleGoogle() {
    signInWithGoogle.mutate(oauthRedirectUrl());
  }

  function handleApple() {
    signInWithApple.mutate(oauthRedirectUrl());
  }

  return (
    <AuthShell
      heroEyebrow="A curated welcome"
      heroTitle={
        <>
          Welcome back.
          <br />
          Find the place you&apos;ll call home.
        </>
      }
      showTrustRow
    >
      <div className="space-y-2">
        <span className="eyebrow-label text-muted-foreground">Sign in</span>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Good to see you again.</h2>
        <p className="body-text text-muted-foreground">Enter your details to continue exploring your saved homes.</p>
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
              disabled={signInWithApple.isPending || redirecting}
              onClick={handleApple}
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-input text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              {signInWithApple.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-foreground" />
              ) : (
                <AppleIcon className="h-4 w-4" />
              )}
              Apple
            </button>
          </div>

      <p className="text-center text-sm text-muted-foreground">
        New to Jayedaad?{' '}
        <a href="/signup" className="font-medium text-foreground underline underline-offset-2">
          Create an account
        </a>
      </p>
    </AuthShell>
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