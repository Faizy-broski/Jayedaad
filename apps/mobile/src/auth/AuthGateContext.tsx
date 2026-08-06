import { createContext, useContext } from 'react';

export type AuthGateContextValue = {
  requireAuth: (onSuccess?: () => void) => void;
  // Lets BecomeAnAgentScreen's "Continue to Dashboard" button proceed
  // regardless of upload completeness, same as web — see
  // AuthGateProvider.tsx's needsAgencyDocuments for what it overrides.
  dismissAgentGate: () => void;
  // Persistent re-entry point (SideDrawer's "Complete Agency Verification"
  // row) — without this, a user who force-quits mid-nag before uploading
  // required onboarding documents has no way back into BecomeAnAgentScreen
  // at all (it's only otherwise reached once, right after fresh signup).
  reopenAgentGate: () => void;
};

// Split out of AuthGateProvider.tsx so screens deep inside the auth sheet
// (BecomeAnAgentScreen, via AuthSheet -> AuthNavigator) can consume
// useAuthGate() without importing AuthGateProvider.tsx itself — that used
// to create a require cycle (AuthGateProvider -> AuthSheet -> AuthNavigator
// -> BecomeAnAgentScreen -> AuthGateProvider). This file has no dependency
// on AuthSheet, so it can't be part of that cycle.
export const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used within AuthGateProvider');
  return ctx;
}
