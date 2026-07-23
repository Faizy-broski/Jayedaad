'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@jayedaad/ui-web';

// Where a successfully-authenticated user lands when they didn't arrive via
// a redirect from a protected route (see middleware.ts's redirectTo param).
// Mirrors the same role set enforced there.
const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/verification',
  verification_staff: '/verification',
  agent: '/crm',
  owner: '/submit',
  buyer: '/search',
};

// Reference implementation for the auth pattern — signup/forgot-password
// pages follow the same shape: useAuthViewModel() for the mutation, Input/
// Label/Button/Card from @jayedaad/ui-web for markup, no business logic in
// this file beyond wiring the two together.
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
  const { signIn } = useAuthViewModel();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { user } = await signIn.mutateAsync({ email, password });
    const redirectTo = searchParams.get('redirectTo');
    const role = user?.app_metadata?.role as string | undefined;
    router.push(redirectTo || DEFAULT_LANDING_BY_ROLE[role ?? ''] || '/');
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Sign in to your Jayedaad account.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {signIn.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
