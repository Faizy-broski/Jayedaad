import { useCallback, useEffect, useRef, useState } from 'react';
import { useAgentProfileViewModel, useAuthViewModel } from '@jayedaad/core';
import { AuthSheet } from './AuthSheet';
import { AuthGateContext } from './AuthGateContext';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

// Replaces the old root-level "swap the whole tree to AuthNavigator" gate.
// Any tap that needs an account calls requireAuth(); if the user is already
// signed in and verified it fires immediately, otherwise it opens the sheet
// and waits. The effect below watches auth state and auto-closes the sheet +
// fires the pending callback the moment sign-in/sign-up+verify completes —
// this is what LoginScreen/VerifyEmailScreen's "the gate handles navigation"
// comments now actually refer to.
export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isEmailVerified, isEmailVerifiedLoading, sendOtp, role, agentId } = useAuthViewModel();
  // enabled: !!agentId inside the hook itself — a no-op fetch for buyers/
  // non-agents, so this costs nothing outside the agency-signup path.
  const { profile, isLoading: isProfileLoading } = useAgentProfileViewModel();
  const [visible, setVisible] = useState(false);
  const [gateRouteAtOpen, setGateRouteAtOpen] = useState<keyof AuthStackParamList>('Login');
  const [agentGateDismissed, setAgentGateDismissed] = useState(false);
  const pendingSuccessRef = useRef<(() => void) | undefined>(undefined);
  // Signup sends the first OTP itself before ever reaching VerifyEmail; a
  // user who lands there via this gate instead (e.g. tapped favorite while
  // logged in but never finished verifying) has never had one sent this
  // session, so VerifyEmailScreen's "we sent a code" would be a lie without
  // this. Guards against re-sending every time requireAuth reopens the sheet
  // — reset on logout below so a different unverified user can get their own.
  const otpAutoSentRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) otpAutoSentRef.current = false;
  }, [isAuthenticated]);

  // Mirrors web's verify-email landingRoute() special-case: a freshly
  // self-registered agency owner shouldn't have the sheet auto-close out
  // from under BecomeAnAgentScreen before they've had a chance to upload
  // documents (or explicitly skip via dismissAgentGate). Also covers an
  // INDEPENDENT agent's own incomplete verification (profile.agency is
  // null in that case) — previously only the agency branch was checked
  // here, so an independent agent whose own owner_id_card/
  // company_registration were missing (the exact 400 setVerificationStatus
  // throws) had no persistent way back into the upload screen once they
  // navigated away from it once.
  const needsAgencyDocuments =
    role === 'agent' &&
    !!agentId &&
    !isProfileLoading &&
    !!profile &&
    (profile.agency ? profile.agency.verificationStatus !== 'verified' : profile.verificationStatus !== 'verified') &&
    !agentGateDismissed;

  // Whether an ordinary account-gated action (favoriting, opening Favorites/
  // Profile) can proceed. Deliberately does NOT factor in
  // needsAgencyDocuments — that used to block every gated action app-wide
  // for an agent with a pending agency, including plain buyer actions that
  // have nothing to do with agency verification (confirmed: tapping the
  // heart icon shouldn't demand ID/company documents). needsAgencyDocuments
  // still matters below, just not for this.
  const isVerified = isAuthenticated && !isEmailVerifiedLoading && isEmailVerified;
  // Only used to keep the sheet open through the post-signup nag (see the
  // auto-close effect below) — not to decide whether requireAuth() should
  // let a generic action through.
  const isFullySatisfied = isVerified && !needsAgencyDocuments;

  // Which screen the sheet should open on. Defaulting to Login whenever
  // isVerified is false was wrong for an already-authenticated user (e.g.
  // tapping the heart icon on a listing while logged in but not yet email-
  // verified) — it asked them to log in again instead of just finishing
  // verification, which reads as "I'm logged in, why is this showing login".
  // Login is only correct when there's genuinely no session. BecomeAnAgent
  // is never an initial route here — the only path to it is via
  // VerifyEmailScreen's own in-sheet navigation right after a fresh signup.
  const gateRoute: keyof AuthStackParamList = !isAuthenticated ? 'Login' : 'VerifyEmail';

  const dismissAgentGate = useCallback(() => setAgentGateDismissed(true), []);

  // Persistent re-entry point for SideDrawer's "Complete Agency
  // Verification" row — re-opens the sheet directly at BecomeAnAgentScreen
  // regardless of agentGateDismissed, so force-quitting mid-nag (or having
  // pressed Continue before this screen enforced completeness) doesn't
  // permanently strand a user with incomplete required documents.
  const reopenAgentGate = useCallback(() => {
    setAgentGateDismissed(false);
    setGateRouteAtOpen('BecomeAnAgent');
    setVisible(true);
  }, []);

  const requireAuth = useCallback(
    (onSuccess?: () => void) => {
      if (isVerified) {
        onSuccess?.();
        return;
      }
      pendingSuccessRef.current = onSuccess;
      setGateRouteAtOpen(gateRoute);
      setVisible(true);
      // Only once we're sure (not mid-query) they're genuinely unverified —
      // firing this during the isEmailVerifiedLoading flash could send a
      // pointless code to an already-verified user.
      if (gateRoute === 'VerifyEmail' && !isEmailVerifiedLoading && !isEmailVerified && !otpAutoSentRef.current) {
        otpAutoSentRef.current = true;
        sendOtp.mutate();
      }
    },
    [isVerified, gateRoute, isEmailVerifiedLoading, isEmailVerified, sendOtp],
  );

  useEffect(() => {
    if (!visible || !isFullySatisfied) return;
    setVisible(false);
    const onSuccess = pendingSuccessRef.current;
    pendingSuccessRef.current = undefined;
    onSuccess?.();
  }, [visible, isFullySatisfied]);

  function handleClose() {
    pendingSuccessRef.current = undefined;
    setVisible(false);
  }

  return (
    <AuthGateContext.Provider value={{ requireAuth, dismissAgentGate, reopenAgentGate }}>
      {children}
      <AuthSheet visible={visible} onClose={handleClose} initialRouteName={gateRouteAtOpen} />
    </AuthGateContext.Provider>
  );
}
