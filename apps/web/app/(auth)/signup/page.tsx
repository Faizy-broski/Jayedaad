'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES, getMaxPhoneDigits, PAKISTAN_CITIES, useAgencyRegistrationViewModel, useAuthViewModel } from '@jayedaad/core';
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
  Select,
} from '@jayedaad/ui-web';

type AccountType = 'individual' | 'agency';

// Slugs are a URL-facing implementation detail agencies shouldn't have to
// think about at signup — auto-derived, same as any typical "company name"
// -> "company-name" slugify, uniqueness enforced by the DB's unique
// constraint on agencies.slug (a collision surfaces as a plain signup error,
// same as any other failed registerSelfService call).
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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
  const { register: registerAgency } = useAgencyRegistrationViewModel();

  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('92');
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [agencyName, setAgencyName] = useState('');
  const [agencyCity, setAgencyCity] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    const formattedPhone = phone ? `+${dialCode.replace(/\D/g, '')}${phone}` : undefined;
    await signUp.mutateAsync({
      email,
      password,
      name,
      phone: formattedPhone,
      marketingOptIn,
      termsAcceptedAt: new Date().toISOString(),
    });

    // Agency registration needs an authenticated session first (it's a
    // self-scoped POST /agencies/register) — signUp() above already returns
    // an active session (Confirm email is off), so this can run right after.
    if (accountType === 'agency') {
      await registerAgency.mutateAsync({
        agencyName,
        agencySlug: slugify(agencyName),
        agencyCity: agencyCity || undefined,
        displayName: name,
        agentPhone: formattedPhone,
      });
    }

    await sendOtp.mutateAsync();
    router.push('/verify-email');
  }

  function handleGoogle() {
    signInWithGoogle.mutate(`${window.location.origin}/auth/callback`);
  }

  const isPending = signUp.isPending || sendOtp.isPending || registerAgency.isPending;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Sign up to start buying, selling, or renting on Jayedaad.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={signInWithGoogle.isPending}
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>

          <div className="my-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('individual')}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  accountType === 'individual' ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground'
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setAccountType('agency')}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  accountType === 'agency' ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground'
                }`}
              >
                Agency
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name">{accountType === 'agency' ? 'Your Name' : 'Name'}</Label>
                <Input id="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
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
              <div className="space-y-1">
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
            </div>

            <div className="space-y-1">
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

            {accountType === 'agency' && (
              <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="agencyName">Agency Name</Label>
                    <Input id="agencyName" required value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="agencyCity">Agency City</Label>
                    <Select id="agencyCity" value={agencyCity} onChange={(e) => setAgencyCity(e.target.value)}>
                      <option value="">Select City</option>
                      {PAKISTAN_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your agency will be reviewed before it goes live — upload verification documents right after signing up.
                </p>
              </div>
            )}

            {passwordMismatch && <p className="text-sm text-destructive">Passwords don&apos;t match.</p>}
            {signUp.isError && <p className="text-sm text-destructive">Could not create your account. Try again.</p>}
            {registerAgency.isError && (
              <p className="text-sm text-destructive">
                {(registerAgency.error as any)?.response?.data?.message || 'Could not register your agency. Try again.'}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="flex items-start gap-2 text-xs leading-tight text-muted-foreground">
                <Checkbox
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5"
                />
                Yes, I&apos;d like to receive marketing communication from Jayedaad.
              </label>
              <label className="flex items-start gap-2 text-xs leading-tight text-muted-foreground">
                <Checkbox
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I have read and I agree to the Jayedaad{' '}
                  <a href="/terms" target="_blank" rel="noreferrer" className="text-primary underline">
                    Terms and Conditions
                  </a>
                  .
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isPending || !termsAccepted}>
              {isPending ? 'Creating account…' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
