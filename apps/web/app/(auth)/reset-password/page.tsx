'use client';

import { FormEvent, Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Home } from 'lucide-react';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Input, Label } from '@jayedaad/ui-web';

// Same split-screen, no-scroll shell as /login and /signup (see those files
// for the centering rationale) — AppChrome omits Header/Footer on this
// route too (see AppChrome.tsx's NO_CHROME_PREFIXES).
//
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
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
    <main className="relative grid h-screen overflow-hidden lg:grid-cols-2">
      <Link
        href="/"
        className="absolute right-6 top-6 z-20 flex items-center gap-1.5 rounded-full border border-input bg-white/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur hover:bg-white"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>

      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/images/login-bg.png"
          alt="A curated Jayedaad home overlooking the coast"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        <div className="absolute left-8 top-8 flex items-center gap-2 text-white">
          <span className="text-xl font-bold tracking-wide">JAYEDAAD</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-4 p-10">
          <span className="eyebrow-label text-white/70">Account recovery</span>
          <h1 className="heading-display leading-[1.1] text-white">
            Almost there.
            <br />
            Choose a new password.
          </h1>
        </div>
      </div>

      <div className="flex justify-center overflow-y-auto px-6 py-6 sm:px-12">
        <div className="my-auto w-full max-w-sm space-y-5">
          <div className="space-y-1">
            <span className="eyebrow-label text-muted-foreground">Reset password</span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Reset your password.</h2>
            <p className="body-text-sm text-muted-foreground">
              Enter the code we emailed you and choose a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="eyebrow-label text-muted-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-full border-input px-5"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code" className="eyebrow-label text-muted-foreground">
                Reset code
              </Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                required
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="h-11 rounded-full border-input px-5"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="eyebrow-label text-muted-foreground">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 rounded-full border-input px-5 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword" className="eyebrow-label text-muted-foreground">
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="h-11 rounded-full border-input px-5 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword((v) => !v)}
                  aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {passwordMismatch && <p className="text-sm text-destructive">Passwords don&apos;t match.</p>}
            {confirmPasswordReset.isError && (
              <p className="text-sm text-destructive">{errorMessage || 'Incorrect or expired code.'}</p>
            )}

            <Button
              type="submit"
              disabled={confirmPasswordReset.isPending || code.length !== 6}
              className="bg-heading-gradient h-11 w-full rounded-full text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {confirmPasswordReset.isPending ? (
                'Resetting…'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Reset password <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <button
              type="button"
              disabled={requestPasswordReset.isPending || resendCooldown > 0}
              onClick={handleResend}
              className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
