'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAgentProfileViewModel, useAuthViewModel } from '@jayedaad/core';
import { Button, Input, Label } from '@jayedaad/ui-web';
import { AuthShell } from '@/components/auth/AuthShell';

const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/admin/dashboard',
  verification_staff: '/verification',
  agent: '/crm',
  owner: '/submit',
  buyer: '/account/saved',
};

// Same split-screen, no-scroll shell as /login and /signup (see those files
// for the centering rationale) — AppChrome omits Header/Footer on this
// route too (see AppChrome.tsx's NO_CHROME_PREFIXES).
export default function VerifyEmailPage() {
  const router = useRouter();
  const { isAuthenticated, isEmailVerified, isEmailVerifiedLoading, role, agentId, verifyOtp, sendOtp } = useAuthViewModel();
  // Only fetches once agentId exists (see useAgentProfileViewModel.ts) — a
  // no-op for buyer/owner/staff accounts.
  const { profile, isLoading: isProfileLoading } = useAgentProfileViewModel();

  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendError, setResendError] = useState('');

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
    try {
      // No explicit redirect here — verifyOtp's onSuccess refetches
      // isEmailVerified (see useAuthViewModel.ts), which flips the effect
      // above and redirects once role/profile state has settled.
      await verifyOtp.mutateAsync(code);
    } catch {
      // verifyOtp.isError already renders the message below — this just
      // stops the rejection from also surfacing as an unhandled-error overlay.
    }
  }

  async function handleResend() {
    setResendError('');
    try {
      await sendOtp.mutateAsync();
      setResendCooldown(60);
    } catch (err: any) {
      // Same class of bug the signup page had: an unguarded mutateAsync call
      // whose rejection was never caught — a real send failure (e.g. SMTP
      // misconfigured/down, surfaced as a 503) crashed the page instead of
      // showing a normal error.
      setResendError(err?.response?.data?.message || 'Could not send the code — please try again in a moment.');
    }
  }

  return (
    <AuthShell
      heroEyebrow="One last step"
      heroTitle={
        <>
          Check your inbox.
          <br />
          Let&apos;s verify it&apos;s you.
        </>
      }
    >
      <div className="space-y-2">
        <span className="eyebrow-label text-muted-foreground">Verify your email</span>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Enter your code.</h2>
        <p className="body-text text-muted-foreground">Enter the 6-digit code we just sent to your email.</p>
      </div>

      <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="eyebrow-label text-muted-foreground">
                Verification code
              </Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                required
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="h-12 rounded-full border-input px-5"
              />
            </div>

            {verifyOtp.isError && (
              <p className="text-sm text-destructive">
                {(verifyOtp.error as any)?.response?.data?.message || 'Incorrect or expired code.'}
              </p>
            )}

            <Button
              type="submit"
              disabled={verifyOtp.isPending || code.length !== 6}
              className="bg-heading-gradient h-12 w-full rounded-full text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {verifyOtp.isPending ? (
                'Verifying…'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Verify <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            {!!resendError && <p className="text-center text-sm text-destructive">{resendError}</p>}

            <button
              type="button"
              disabled={sendOtp.isPending || resendCooldown > 0}
              onClick={handleResend}
              className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            </button>
          </form>
    </AuthShell>
  );
}
