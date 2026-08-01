'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAgentProfileViewModel, useAuthViewModel } from '@jayedaad/core';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label } from '@jayedaad/ui-web';

const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/admin/dashboard',
  verification_staff: '/verification',
  agent: '/dashboard',
  owner: '/submit',
  buyer: '/search',
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isEmailVerified, isEmailVerifiedLoading, role, agentId, verifyOtp, sendOtp } = useAuthViewModel();
  // Only fetches once agentId exists (see useAgentProfileViewModel.ts) — a
  // no-op for buyer/owner/staff accounts.
  const { profile, isLoading: isProfileLoading } = useAgentProfileViewModel();

  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSendFailed, setOtpSendFailed] = useState(searchParams.get('otpSendFailed') === '1');

  // A fresh agent (self-service agent application OR agency registration)
  // hasn't uploaded onboarding documents yet — send them to
  // /become-an-agent's document step instead of straight into the portal.
  // Not gated on isProfileLoading in the dependency check below: for
  // non-agent roles agentId is undefined and this branch never applies.
  function landingRoute(): string {
    if (role === 'agent' && agentId) {
      const stillPending = !profile || profile.verificationStatus !== 'verified' || (profile.agency && profile.agency.verificationStatus !== 'verified');
      if (stillPending) return '/become-an-agent';
    }
    return DEFAULT_LANDING_BY_ROLE[role ?? ''] || '/';
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isEmailVerifiedLoading && isEmailVerified && !(role === 'agent' && isProfileLoading)) {
      router.replace(landingRoute());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isEmailVerified, isEmailVerifiedLoading, role, agentId, profile, isProfileLoading, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    // No explicit redirect here — verifyOtp's onSuccess refetches
    // isEmailVerified (see useAuthViewModel.ts), which flips the effect
    // above and redirects once role/profile state has settled.
    await verifyOtp.mutateAsync(code);
  }

  async function handleResend() {
    await sendOtp.mutateAsync();
    setOtpSendFailed(false);
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
            {otpSendFailed && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                Your account was created, but we couldn&apos;t send your verification code. Tap &quot;Resend code&quot; below to try again.
              </p>
            )}
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
