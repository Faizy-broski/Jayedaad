import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuthViewModel } from '@jayedaad/core';
import { AuthSheet } from './AuthSheet';

type AuthGateContextValue = {
  requireAuth: (onSuccess?: () => void) => void;
};

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

// Replaces the old root-level "swap the whole tree to AuthNavigator" gate.
// Any tap that needs an account calls requireAuth(); if the user is already
// signed in and verified it fires immediately, otherwise it opens the sheet
// and waits. The effect below watches auth state and auto-closes the sheet +
// fires the pending callback the moment sign-in/sign-up+verify completes —
// this is what LoginScreen/VerifyEmailScreen's "the gate handles navigation"
// comments now actually refer to.
export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isEmailVerified, isEmailVerifiedLoading } = useAuthViewModel();
  const [visible, setVisible] = useState(false);
  const pendingSuccessRef = useRef<(() => void) | undefined>(undefined);

  const isSatisfied = isAuthenticated && !isEmailVerifiedLoading && isEmailVerified;

  const requireAuth = useCallback(
    (onSuccess?: () => void) => {
      if (isSatisfied) {
        onSuccess?.();
        return;
      }
      pendingSuccessRef.current = onSuccess;
      setVisible(true);
    },
    [isSatisfied],
  );

  useEffect(() => {
    if (!visible || !isSatisfied) return;
    setVisible(false);
    const onSuccess = pendingSuccessRef.current;
    pendingSuccessRef.current = undefined;
    onSuccess?.();
  }, [visible, isSatisfied]);

  function handleClose() {
    pendingSuccessRef.current = undefined;
    setVisible(false);
  }

  return (
    <AuthGateContext.Provider value={{ requireAuth }}>
      {children}
      <AuthSheet visible={visible} onClose={handleClose} />
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used within AuthGateProvider');
  return ctx;
}
