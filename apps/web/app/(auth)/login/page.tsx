'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Input, Label } from '@jayedaad/ui-web';
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

// Field order/grouping mirrors Zameen.com's login modal (Google -> OR ->
// fields -> Remember Me/Forgot Password -> Sign Up prompt), restyled onto
// our existing full-page route rather than converting to a modal.
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
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
  }

  function handleGoogle() {
    const next = searchParams.get('redirectTo') || '/';
    signInWithGoogle.mutate(`${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Sign in to your Jayedaad account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={signInWithGoogle.isPending}
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {signIn.isError && <p className="text-sm text-destructive">Incorrect email or password.</p>}

            <Button type="submit" className="w-full" disabled={signIn.isPending}>
              {signIn.isPending ? 'Signing in…' : 'Log In'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember Me
              </label>
              <a href="/forgot-password" className="text-primary underline">
                Forgot Password?
              </a>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="underline">
                Sign up
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
