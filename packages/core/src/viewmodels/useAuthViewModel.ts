import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AuthCredentials,
  SignUpInput,
  changePassword,
  confirmPasswordReset,
  exchangeCodeForSession,
  getEmailVerified,
  getGoogleOAuthUrl,
  getUserAgentId,
  getUserRole,
  requestPasswordReset,
  sendOtpCode,
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
  const getGoogleOAuthUrlMutation = useMutation({
    mutationFn: (redirectTo: string) => getGoogleOAuthUrl(redirectTo),
  });
  const exchangeCodeMutation = useMutation({
    mutationFn: (code: string) => exchangeCodeForSession(code),
  });

  // email_verified is an app-table column (profiles), not part of the
  // Supabase session/JWT — it lives in react-query's cache, not the Zustand
  // auth store, so it participates in the same invalidate/refetch machinery
  // as every other server-owned value in this codebase.
  const emailVerifiedQuery = useQuery({
    queryKey: ['auth', 'emailVerified', user?.id],
    queryFn: getEmailVerified,
    enabled: !!session,
    staleTime: Infinity,
  });

  const sendOtp = useMutation({ mutationFn: () => sendOtpCode() });
  const verifyOtp = useMutation({
    mutationFn: (code: string) => verifyOtpCode(code),
    onSuccess: () => emailVerifiedQuery.refetch(),
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
    isEmailVerified: emailVerifiedQuery.data ?? false,
    isEmailVerifiedLoading: emailVerifiedQuery.isLoading,
    // For callers that need an up-to-date answer synchronously right after
    // signIn resolves (e.g. login/page.tsx deciding where to redirect),
    // rather than waiting on the query's own enabled/staleTime lifecycle.
    refetchEmailVerified: emailVerifiedQuery.refetch,
    role: getUserRole(user),
    agentId: getUserAgentId(user),
    signIn,
    signUp: signUpMutation,
    signOut: signOutMutation,
    signInWithGoogle: signInWithGoogleMutation,
    getGoogleOAuthUrl: getGoogleOAuthUrlMutation,
    exchangeCodeForSession: exchangeCodeMutation,
    sendOtp,
    verifyOtp,
    requestPasswordReset: requestPasswordResetMutation,
    confirmPasswordReset: confirmPasswordResetMutation,
    changePassword: changePasswordMutation,
    deleteAccount: deleteAccountMutation,
  };
}
