'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { PAKISTAN_CITIES, slugify, useAgencyRegistrationViewModel, useAgentProfileViewModel, useAuthViewModel } from '@jayedaad/core';
import { Button, Input, Label, Select } from '@jayedaad/ui-web';
import { AuthShell } from '@/components/auth/AuthShell';

// Reached right after a fresh Google/Apple sign-in that started from
// /signup's Agency tab (see signup/page.tsx's oauthRedirectUrl, which sets
// ?next=/signup/agency-details on the OAuth redirectTo). The OAuth
// round-trip has no way to collect these fields before leaving the app, so
// they're collected here instead, then handed to the exact same
// registerSelfService call the password-based Agency signup already uses —
// same "buyer -> agent" flip, same pending-review agency creation.
//
// Deliberately self-contained: this page never consults the
// role->route DEFAULT_LANDING_BY_ROLE maps duplicated across
// login/page.tsx, verify-email/page.tsx, and auth/callback/route.ts (which
// have a known, pre-existing /dashboard vs /crm inconsistency, out of scope
// here) — a freshly-registered agency's agent_profiles/agencies rows are
// always created verificationStatus: 'pending', so the only real
// destination a successful submission here ever needs is
// /become-an-agent, unconditionally. The rare defensive edge cases below
// (already a verified agent, or some other role entirely) fall back to '/'.
export default function AgencyDetailsPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, user, role, agentId } = useAuthViewModel();
  const { profile, isLoading: isProfileLoading } = useAgentProfileViewModel();
  const { register: registerAgency } = useAgencyRegistrationViewModel();

  const [displayName, setDisplayName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyCity, setAgencyCity] = useState('');
  const [salesAssociateCount, setSalesAssociateCount] = useState('');
  const [associateCountError, setAssociateCountError] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Pre-filled once from the OAuth identity's own metadata (Google/Apple
  // both populate one of these) — an OAuth user never typed a name
  // anywhere in this app, unlike the password-signup path.
  const [nameInitialized, setNameInitialized] = useState(false);

  useEffect(() => {
    if (nameInitialized || !user) return;
    const metadataName = (user.user_metadata as Record<string, unknown> | undefined)?.full_name ?? (user.user_metadata as Record<string, unknown> | undefined)?.name;
    if (typeof metadataName === 'string' && metadataName) setDisplayName(metadataName);
    setNameInitialized(true);
  }, [user, nameInitialized]);

  // isInitializing guards against a flash-redirect to /login before the
  // client session hydrates — unlike verify-email/page.tsx (always reached
  // via an in-page router.push with the session already resolved), this
  // page is reached via a fresh document load returning from Google/Apple.
  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (role === 'agent' && agentId) {
      // Already registered — a returning agency owner who reached this URL
      // again, or a reload right after a successful submit. Never show the
      // form twice.
      if (isProfileLoading) return;
      const stillPending =
        !profile || profile.verificationStatus !== 'verified' || (profile.agency && profile.agency.verificationStatus !== 'verified');
      router.replace(stillPending ? '/become-an-agent' : '/');
      return;
    }
    if (role && role !== 'buyer') {
      // super_admin/verification_staff/owner has no business here.
      router.replace('/');
    }
  }, [isInitializing, isAuthenticated, role, agentId, profile, isProfileLoading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!(Number(salesAssociateCount) > 0)) {
      setAssociateCountError(true);
      return;
    }
    setAssociateCountError(false);
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await registerAgency.mutateAsync({
        agencyName,
        agencySlug: slugify(agencyName),
        agencyPhone: agencyPhone.trim() || undefined,
        agencyEmail: agencyEmail.trim() || undefined,
        agencyCity: agencyCity || undefined,
        displayName: displayName.trim() || undefined,
        salesAssociateCount: Number(salesAssociateCount),
      });
      // registerAgency's onSuccess already calls refreshSession() — role/
      // agentId are current by the time this resolves.
      router.push('/become-an-agent');
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Something went wrong — please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      heroEyebrow="Almost there"
      heroTitle={
        <>
          Tell us about
          <br />
          your agency.
        </>
      }
      rightMaxWidth="max-w-md"
      rightPadding="py-4"
      rightGap="space-y-3"
    >
      <div className="space-y-0.5">
        <span className="eyebrow-label text-muted-foreground">Agency details</span>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">One last step.</h2>
        <p className="body-text-sm text-muted-foreground">
          You&apos;re signed in with {user?.email ?? 'your account'} — just a few agency details before your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="space-y-1">
          <Label htmlFor="displayName" className="eyebrow-label text-muted-foreground">
            Your name
          </Label>
          <Input
            id="displayName"
            required
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-10 rounded-full border-input px-5"
          />
        </div>

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
            {associateCountError && <p className="text-xs text-destructive">Enter the number of sales associates in your company.</p>}
          </div>
          <p className="text-xs leading-snug text-muted-foreground">
            Your agency will be reviewed before it goes live — upload verification documents right after this step.
          </p>
        </div>

        {!!submitError && <p className="text-xs text-destructive">{submitError}</p>}

        <Button
          type="submit"
          disabled={isSubmitting || registerAgency.isPending}
          className="bg-heading-gradient h-10 w-full rounded-full text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting || registerAgency.isPending ? (
            'Setting up your agency…'
          ) : (
            <span className="flex items-center justify-center gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
