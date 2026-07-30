'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label } from '@jayedaad/ui-web';

// Wrapped in Suspense: reads the email via useSearchParams (passed from
// /forgot-password), same requirement as login/page.tsx's redirectTo param.
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmPasswordReset, requestPasswordReset } = useAuthViewModel();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    await confirmPasswordReset.mutateAsync({ email, code, newPassword });
    router.push('/login');
  }

  async function handleResend() {
    await requestPasswordReset.mutateAsync(email);
    setResendCooldown(60);
    setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
  }

  const errorMessage = (confirmPasswordReset.error as any)?.response?.data?.message;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter the code we emailed you and choose a new password.</CardDescription>
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
              <Label htmlFor="code">Reset code</Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                required
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            {passwordMismatch && <p className="text-sm text-destructive">Passwords don&apos;t match.</p>}
            {confirmPasswordReset.isError && (
              <p className="text-sm text-destructive">{errorMessage || 'Incorrect or expired code.'}</p>
            )}

            <Button type="submit" className="w-full" disabled={confirmPasswordReset.isPending || code.length !== 6}>
              {confirmPasswordReset.isPending ? 'Resetting…' : 'Reset password'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={requestPasswordReset.isPending || resendCooldown > 0}
              onClick={handleResend}
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
