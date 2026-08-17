import { useMutation } from '@tanstack/react-query';
import {
  AuthCredentials,
  SignUpInput,
  changePassword,
  confirmPasswordReset,
  exchangeCodeForSession,
  getAppleOAuthUrl,
  getGoogleOAuthUrl,
  getUserAgentId,
  getUserEmailVerified,
  getUserRole,
  refreshSession,
  requestPasswordReset,
  sendOtpCode,
  signInWithApple,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUp,
  verifyOtpCode,
} from '../services/authService';
import { accountRepository } from '../services/accountRepository';
import { useAuthStore } from '../state/useAuthStore';

// The single entry point apps are expected to call for anything auth-related
// — reactive session state (via useAuthStore) plus the write actions
// (sign in/up/out), each wrapped as a mutation so pages get the same
// isPending/isError/mutate(Async) shape every other write path in this
// codebase already uses (see useListingSubmissionViewModel, etc.). Pages
// should never import authService or useAuthStore directly — this hook is
// the boundary.
export function useAuthViewModel() {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  const signIn = useMutation({
    mutationFn: (credentials: AuthCredentials) => signInWithPassword(credentials),
  });
  const signUpMutation = useMutation({
    mutationFn: (input: SignUpInput) => signUp(input),
  });
  const signOutMutation = useMutation({
    mutationFn: () => signOut(),
  });
  const signInWithGoogleMutation = useMutation({
    mutationFn: (redirectTo: string) => signInWithGoogle(redirectTo),
  });
  const signInWithAppleMutation = useMutation({
    mutationFn: (redirectTo: string) => signInWithApple(redirectTo),
  });
  const getGoogleOAuthUrlMutation = useMutation({
    mutationFn: (redirectTo: string) => getGoogleOAuthUrl(redirectTo),
  });
  const getAppleOAuthUrlMutation = useMutation({
    mutationFn: (redirectTo: string) => getAppleOAuthUrl(redirectTo),
  });
  const exchangeCodeMutation = useMutation({
    mutationFn: (code: string) => exchangeCodeForSession(code),
  });

  // email_verified is an app_metadata JWT claim now (see
  // getUserEmailVerified's comment) — a synchronous read off the same
  // `user` object role/agentId already come from, not a query. No
  // loading/error state exists anymore because there's no fetch to wait on
  // or fail.
  const isEmailVerified = getUserEmailVerified(user);

  const sendOtp = useMutation({ mutationFn: () => sendOtpCode() });
  const verifyOtp = useMutation({
    mutationFn: (code: string) => verifyOtpCode(code),
    // Pulls a fresh JWT so the app_metadata.email_verified claim
    // OtpRepository.markEmailVerified just stamped server-side is reflected
    // here immediately — same refreshSession() pattern already used by
    // useOwnerVerificationViewModel.ts after a role change.
    onSuccess: () => refreshSession(),
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
  const confirmPasswordResetMutation = useMutation({
    mutationFn: (input: { email: string; code: string; newPassword: string }) => confirmPasswordReset(input),
  });
  const changePasswordMutation = useMutation({
    mutationFn: (input: { oldPassword: string; newPassword: string }) =>
      changePassword({ email: user!.email!, ...input }),
  });
  // The backend hard-deletes the auth.users row, invalidating the session
  // server-side — signOut() afterwards just clears local state so
  // RootNavigator swaps back to AuthNavigator immediately.
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await accountRepository.deleteAccount();
      await signOut();
    },
  });

  return {
    session,
    user,
    isAuthenticated: !!session,
    isInitializing,
    isEmailVerified,
    // Always false/false now — kept in the returned shape (rather than
    // removed) so every existing consumer (RequireEmailVerified,
    // AuthGateProvider, BottomTabNavigator, etc.) keeps working unmodified
    // against a value that's simply always synchronously available.
    isEmailVerifiedLoading: false,
    isEmailVerifiedError: false,
    // No longer an actual refetch (there's nothing to fetch) — kept as a
    // same-shaped async function so callers that `await` it (e.g.
    // login/page.tsx) don't need to change.
    refetchEmailVerified: async () => ({ data: isEmailVerified }),
    role: getUserRole(user),
    agentId: getUserAgentId(user),
    signIn,
    signUp: signUpMutation,
    signOut: signOutMutation,
    signInWithGoogle: signInWithGoogleMutation,
    signInWithApple: signInWithAppleMutation,
    getGoogleOAuthUrl: getGoogleOAuthUrlMutation,
    getAppleOAuthUrl: getAppleOAuthUrlMutation,
    exchangeCodeForSession: exchangeCodeMutation,
    sendOtp,
    verifyOtp,
    requestPasswordReset: requestPasswordResetMutation,
    confirmPasswordReset: confirmPasswordResetMutation,
    changePassword: changePasswordMutation,
    deleteAccount: deleteAccountMutation,
  };
}
