'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { COUNTRIES, getMaxPhoneDigits, PAKISTAN_CITIES, slugify, useAgencyRegistrationViewModel, useAuthViewModel } from '@jayedaad/core';
import { Button, Checkbox, CountryCodeSelect, Input, Label, Select } from '@jayedaad/ui-web';
import { AuthShell } from '@/components/auth/AuthShell';

type AccountType = 'individual' | 'agency';

// Split-screen layout matching /login: full-bleed hero image + copy on the
// left (sticky, so it stays put while the longer form scrolls on the
// right), pill-styled fields on the right. Field order/grouping still
// mirrors Zameen.com's signup modal (Google -> OR -> Name/Email/Password/
// Confirm/Phone -> marketing + terms checkboxes -> submit) — only the
// chrome around it changed. On success, Supabase already returns an active
// session (Confirm email is off — profiles.email_verified is the real gate,
// see services/api/src/auth/otp), so we fire the first OTP email
// immediately and send the user to /verify-email rather than any role
// landing.
export default function SignupPage() {
  const router = useRouter();
  const { signUp, signIn, sendOtp, signInWithGoogle, signInWithApple } = useAuthViewModel();
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agencyName, setAgencyName] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyCity, setAgencyCity] = useState('');
  const [salesAssociateCount, setSalesAssociateCount] = useState('');
  const [associateCountError, setAssociateCountError] = useState(false);
  // Everything after the initial signUp() used to run with no error
  // handling at all — a failure partway through (registerAgency or
  // sendOtp) left an unhandled promise rejection: the auth.users row was
  // already permanently created by signUp(), but the page never surfaced
  // why the rest of the flow died (Next.js's raw error overlay instead of a
  // form error). Retrying then hit signUp() again for an email that now
  // already exists — Supabase rejects that with a 422 "already registered"
  // — producing a second, misleading error for an account that, in fact,
  // already exists. This single submitError + the recovery path below
  // replace that dead end (mirrors apps/mobile/src/screens/auth/SignupScreen.tsx,
  // which hit and fixed this same bug first).
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    // Mandatory at agency onboarding per the Document Verification spec.
    if (accountType === 'agency' && !(Number(salesAssociateCount) > 0)) {
      setAssociateCountError(true);
      return;
    }
    setAssociateCountError(false);
    setSubmitError('');
    const formattedPhone = phone ? `+${dialCode.replace(/\D/g, '')}${phone}` : undefined;

    setIsSubmitting(true);
    try {
      // Captures whichever branch below actually authenticates, so the
      // agency-registration decision after it can be based on this
      // specific account's real state (JWT app_metadata), not on guessing
      // from an error message — see the note further down on why that
      // matters.
      let resumedUser: any;
      try {
        const result = await signUp.mutateAsync({
          email,
          password,
          name,
          phone: formattedPhone,
          marketingOptIn,
          termsAcceptedAt: new Date().toISOString(),
        });
        resumedUser = result.user;
      } catch (err: any) {
        // Resume instead of dead-ending: if this email is "already
        // registered" it's most likely this exact scenario — a previous
        // attempt's signUp succeeded but a later step failed before ever
        // reaching verify-email. Signing in with the same credentials the
        // user just typed picks the same account back up; if the password
        // doesn't match (a genuinely different account), signIn fails too
        // and the real error below still surfaces.
        const alreadyRegistered = err?.status === 422 || /already registered/i.test(err?.message ?? '');
        if (!alreadyRegistered) throw err;
        const result = await signIn.mutateAsync({ email, password });
        resumedUser = result.user;
      }

      // Agency registration needs an authenticated session first (it's a
      // self-scoped POST /agencies/register) — signUp()/signIn() above
      // already returns an active session (Confirm email is off), so this
      // can run right after.
      // Skip re-registering only when THIS account's own JWT already shows
      // it as an agent with an agency (a prior attempt's registerAgency
      // call already succeeded before a later step failed). Deliberately
      // NOT based on matching "already" in the error message below — the
      // server returns that exact wording for a genuinely different agency
      // owning the requested name too, and swallowing that case would
      // silently skip agency creation while telling the user signup
      // succeeded.
      const alreadyHasAgency = resumedUser?.app_metadata?.role === 'agent' && !!resumedUser?.app_metadata?.agent_id;
      if (accountType === 'agency' && !alreadyHasAgency) {
        await registerAgency.mutateAsync({
          agencyName,
          agencySlug: slugify(agencyName),
          agencyPhone: agencyPhone.trim() || undefined,
          agencyEmail: agencyEmail.trim() || undefined,
          agencyCity: agencyCity || undefined,
          displayName: name,
          agentPhone: formattedPhone,
          salesAssociateCount: Number(salesAssociateCount),
        });
      }

      // A failed OTP send isn't fatal to the flow — verify-email has its
      // own "Resend" action, so let the user continue there rather than
      // stranding them on this page with an already-created,
      // already-signed-in account.
      try {
        await sendOtp.mutateAsync();
      } catch {
        // non-fatal
      }

      router.push('/verify-email');
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Something went wrong — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Google/Apple's OAuth round-trip leaves the app entirely before there's
  // any chance to collect agency name/city/phone/associate-count — so an
  // Agency-intent OAuth signup is routed through /signup/agency-details
  // first via ?next= (same passthrough mechanism login/page.tsx already
  // uses for its own "continue to X after sign-in" redirect; the callback
  // route validates next is an internal path before honoring it). An
  // Individual-intent signup passes no next and keeps today's plain
  // role-based landing.
  function oauthRedirectUrl(): string {
    const next = accountType === 'agency' ? '/signup/agency-details' : '';
    const query = next ? `?next=${encodeURIComponent(next)}` : '';
    return `${window.location.origin}/auth/callback${query}`;
  }

  function handleGoogle() {
    signInWithGoogle.mutate(oauthRedirectUrl());
  }

  function handleApple() {
    signInWithApple.mutate(oauthRedirectUrl());
  }

  const isPending = isSubmitting || signUp.isPending || signIn.isPending || sendOtp.isPending || registerAgency.isPending;

  return (
    <AuthShell
      heroEyebrow="Join Jayedaad"
      heroTitle={
        <>
          Start your search.
          <br />
          Find the place you&apos;ll call home.
        </>
      }
      showTrustRow
      rightMaxWidth="max-w-md"
      rightPadding="py-4"
      rightGap="space-y-3"
    >
      <div className="space-y-0.5">
        <span className="eyebrow-label text-muted-foreground">Create account</span>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Let&apos;s get you started.</h2>
        <p className="body-text-sm text-muted-foreground">
          Sign up to start buying, selling, or renting on Jayedaad.
        </p>
      </div>

          {/* Offered for both account types — an Agency-intent click routes
              through /signup/agency-details after OAuth completes (see
              oauthRedirectUrl above) to collect the fields this round-trip
              can't carry, instead of being hidden entirely like before.
              apps/mobile/src/screens/auth/SignupScreen.tsx still has its own
              individual-only guard around its Google button — mobile parity
              for this flow is a separate follow-up, not in scope here. */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={signInWithGoogle.isPending}
              onClick={handleGoogle}
              className="flex h-10 items-center justify-center gap-2 rounded-full border border-input text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <GoogleIcon className="h-4 w-4" />
              Google
            </button>
            <button
              type="button"
              disabled={signInWithApple.isPending}
              onClick={handleApple}
              className="flex h-10 items-center justify-center gap-2 rounded-full border border-input text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <AppleIcon className="h-4 w-4" />
              Apple
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="eyebrow-label whitespace-nowrap text-muted-foreground">Or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="flex gap-2 rounded-full border border-input bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setAccountType('individual')}
                className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  accountType === 'individual'
                    ? 'bg-heading-gradient text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setAccountType('agency')}
                className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  accountType === 'agency'
                    ? 'bg-heading-gradient text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Agency
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="eyebrow-label text-muted-foreground">
                  {accountType === 'agency' ? 'Your name' : 'Name'}
                </Label>
                <Input
                  id="name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-full border-input px-5"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="eyebrow-label text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-full border-input px-5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="password" className="eyebrow-label text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 rounded-full border-input px-5 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="eyebrow-label text-muted-foreground">
                  Confirm password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 rounded-full border-input px-5 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="eyebrow-label text-muted-foreground">
                Phone
              </Label>
              <div className="flex items-center gap-2">
                <CountryCodeSelect
                  countries={COUNTRIES}
                  value={dialCode}
                  onChange={setDialCode}
                  className="h-10 w-[110px] shrink-0 rounded-full"
                />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="3XXXXXXXXX"
                  value={phone}
                  maxLength={getMaxPhoneDigits(dialCode)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
                  className="h-10 min-w-0 flex-1 rounded-full border-input px-5"
                />
              </div>
            </div>

            {accountType === 'agency' && (
              <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="agencyName" className="eyebrow-label text-muted-foreground">
                      Agency name
                    </Label>
                    <Input
                      id="agencyName"
                      required
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="h-10 rounded-full border-input px-5"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="agencyCity" className="eyebrow-label text-muted-foreground">
                      Agency city
                    </Label>
                    <Select
                      id="agencyCity"
                      value={agencyCity}
                      onChange={(e) => setAgencyCity(e.target.value)}
                      className="h-10 rounded-full border-input px-5"
                    >
                      <option value="">Select city</option>
                      {PAKISTAN_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="agencyPhone" className="eyebrow-label text-muted-foreground">
                      Agency phone
                    </Label>
                    <Input
                      id="agencyPhone"
                      type="tel"
                      value={agencyPhone}
                      onChange={(e) => setAgencyPhone(e.target.value)}
                      className="h-10 rounded-full border-input px-5"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="agencyEmail" className="eyebrow-label text-muted-foreground">
                      Agency email
                    </Label>
                    <Input
                      id="agencyEmail"
                      type="email"
                      value={agencyEmail}
                      onChange={(e) => setAgencyEmail(e.target.value)}
                      className="h-10 rounded-full border-input px-5"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="salesAssociateCount" className="eyebrow-label text-muted-foreground">
                    Number of sales associates
                  </Label>
                  <Input
                    id="salesAssociateCount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    required
                    value={salesAssociateCount}
                    onChange={(e) => setSalesAssociateCount(e.target.value.replace(/\D/g, ''))}
                    className="h-10 rounded-full border-input px-5"
                  />
                  {associateCountError && (
                    <p className="text-xs text-destructive">Enter the number of sales associates in your company.</p>
                  )}
                </div>
                <p className="text-xs leading-snug text-muted-foreground">
                  Your agency will be reviewed before it goes live — upload verification documents right after signing up.
                </p>
              </div>
            )}

            {passwordMismatch && <p className="text-xs text-destructive">Passwords don&apos;t match.</p>}
            {!!submitError && <p className="text-xs text-destructive">{submitError}</p>}

            <div className="space-y-1.5">
              <label className="flex items-start gap-2 text-xs leading-tight text-muted-foreground">
                <Checkbox checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5" />
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
                  <a href="/terms" target="_blank" rel="noreferrer" className="font-medium text-foreground underline">
                    Terms and Conditions
                  </a>
                  .
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isPending || !termsAccepted}
              className="bg-heading-gradient h-10 w-full rounded-full text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? (
                'Creating account…'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-foreground underline underline-offset-2">
          Sign in
        </a>
      </p>
    </AuthShell>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.36 1.4c.09 1.1-.32 2.13-1.02 2.9-.72.79-1.9 1.4-3 1.32-.11-1.06.36-2.16 1.03-2.87.75-.8 2.03-1.4 2.99-1.35zM20.2 17.02c-.53 1.22-.78 1.76-1.46 2.83-.95 1.5-2.29 3.37-3.95 3.39-1.48.02-1.86-.97-3.87-.96-2 .01-2.42.98-3.9.96-1.66-.02-2.93-1.7-3.88-3.2C1 16.6.68 12.7 2.02 10.62c.95-1.48 2.46-2.34 3.87-2.34 1.44 0 2.34.97 3.53.97 1.15 0 1.85-.97 3.53-.97 1.26 0 2.6.68 3.55 1.86-3.12 1.71-2.61 6.16.7 6.88z" />
    </svg>
  );
}