'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label } from '@jayedaad/ui-web';

const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/admin/dashboard',
  verification_staff: '/verification',
  agent: '/crm',
  owner: '/submit',
  buyer: '/search',
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const { isAuthenticated, isEmailVerified, isEmailVerifiedLoading, role, verifyOtp, sendOtp } = useAuthViewModel();

  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isEmailVerifiedLoading && isEmailVerified) {
      router.replace(DEFAULT_LANDING_BY_ROLE[role ?? ''] || '/');
    }
  }, [isAuthenticated, isEmailVerified, isEmailVerifiedLoading, role, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    await verifyOtp.mutateAsync(code);
    router.replace(DEFAULT_LANDING_BY_ROLE[role ?? ''] || '/');
  }

  async function handleResend() {
    await sendOtp.mutateAsync();
    setResendCooldown(60);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>Enter the 6-digit code we just sent to your email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Verification code</Label>
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

            {verifyOtp.isError && (
              <p className="text-sm text-destructive">
                {(verifyOtp.error as any)?.response?.data?.message || 'Incorrect or expired code.'}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={verifyOtp.isPending || code.length !== 6}>
              {verifyOtp.isPending ? 'Verifying…' : 'Verify'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={sendOtp.isPending || resendCooldown > 0}
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
