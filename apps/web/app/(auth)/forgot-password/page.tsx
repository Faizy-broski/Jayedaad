'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Home } from 'lucide-react';
import { useAuthViewModel } from '@jayedaad/core';
import { Button, Input, Label } from '@jayedaad/ui-web';

// Custom OTP-based reset (services/api/src/auth/password-reset) — NOT
// Supabase's built-in reset-link email. This page just requests the code;
// entering it + the new password happens on /reset-password.
//
// Same split-screen, no-scroll shell as /login and /signup (see those files
// for the centering rationale) — AppChrome omits Header/Footer on this
// route too (see AppChrome.tsx's NO_CHROME_PREFIXES).
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
            Forgot your password?
            <br />
            We&apos;ll get you back in.
          </h1>
        </div>
      </div>

      <div className="flex justify-center overflow-y-auto px-6 py-10 sm:px-12">
        <div className="my-auto w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <span className="eyebrow-label text-muted-foreground">Forgot password</span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Reset your password.</h2>
            <p className="body-text text-muted-foreground">Enter your email and we&apos;ll send you a reset code.</p>
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

            <Button
              type="submit"
              disabled={requestPasswordReset.isPending}
              className="bg-heading-gradient h-12 w-full rounded-full text-base font-semibold text-primary-foreground hover:opacity-90"
            >
              {requestPasswordReset.isPending ? (
                'Sending…'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Send reset code <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Remembered your password?{' '}
            <a href="/login" className="font-medium text-foreground underline underline-offset-2">
              Back to sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
