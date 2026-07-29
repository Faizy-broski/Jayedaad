'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES, getMaxPhoneDigits, useAuthViewModel } from '@jayedaad/core';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Checkbox,
  CountryCodeSelect,
  Input,
  Label,
} from '@jayedaad/ui-web';

// Field order/grouping mirrors Zameen.com's signup modal (Google -> OR ->
// Name/Email/Password/Confirm/Phone -> marketing + terms checkboxes ->
// submit), restyled onto our existing full-page route. On success, Supabase
// already returns an active session (Confirm email is off —
// profiles.email_verified is the real gate, see services/api/src/auth/otp),
// so we fire the first OTP email immediately and send the user to
// /verify-email rather than any role landing.
export default function SignupPage() {
  const router = useRouter();
  const { signUp, sendOtp, signInWithGoogle } = useAuthViewModel();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('92');
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    await signUp.mutateAsync({
      email,
      password,
      name,
      phone: phone ? `+${dialCode.replace(/\D/g, '')}${phone}` : undefined,
      marketingOptIn,
      termsAcceptedAt: new Date().toISOString(),
    });
    await sendOtp.mutateAsync();
    router.push('/verify-email');
  }

  function handleGoogle() {
    signInWithGoogle.mutate(`${window.location.origin}/auth/callback`);
  }

  const isPending = signUp.isPending || sendOtp.isPending;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Sign up to start buying, selling, or renting on Jayedaad.</CardDescription>
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
              <Label htmlFor="name">Name</Label>
              <Input id="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <div className="flex items-center gap-2">
                <CountryCodeSelect countries={COUNTRIES} value={dialCode} onChange={setDialCode} className="w-[110px] shrink-0" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="3XXXXXXXXX"
                  value={phone}
                  maxLength={getMaxPhoneDigits(dialCode)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
                  className="min-w-0 flex-1"
                />
              </div>
            </div>

            {passwordMismatch && <p className="text-sm text-destructive">Passwords don&apos;t match.</p>}
            {signUp.isError && <p className="text-sm text-destructive">Could not create your account. Try again.</p>}

            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5"
              />
              Yes, I&apos;d like to receive marketing communication from Jayedaad.
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5"
              />
              I have read and I agree to the Jayedaad{' '}
              <a href="/terms" target="_blank" rel="noreferrer" className="text-primary underline">
                Terms and Conditions
              </a>
              .
            </label>

            <Button type="submit" className="w-full" disabled={isPending || !termsAccepted}>
              {isPending ? 'Creating account…' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
