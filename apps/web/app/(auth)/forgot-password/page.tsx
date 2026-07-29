'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label } from '@jayedaad/ui-web';

// Custom OTP-based reset (services/api/src/auth/password-reset) — NOT
// Supabase's built-in reset-link email. This page just requests the code;
// entering it + the new password happens on /reset-password.
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset } = useAuthViewModel();
  const [email, setEmail] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await requestPasswordReset.mutateAsync(email);
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send you a reset code.</CardDescription>
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

            <Button type="submit" className="w-full" disabled={requestPasswordReset.isPending}>
              {requestPasswordReset.isPending ? 'Sending…' : 'Send reset code'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <a href="/login" className="underline">
                Back to sign in
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
