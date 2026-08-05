import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownersRepository } from '../services/ownersRepository';
import { refreshSession } from '../services/authService';
import { OwnerIdentityDocumentType } from '../models';
import { useAuthViewModel } from './useAuthViewModel';

// Backs the "Verify your identity to continue" gate on Post Listing —
// individual owners only, mirrors the agent onboarding-document screens.
// GET /owners/me/verification is @Roles('owner')-gated server-side, so the
// query is disabled for any other role — PostListingScreen calls this hook
// unconditionally (rules of hooks), and without this guard every agent
// opening Post Listing would fire a doomed, retried 403 request.
export function useOwnerVerificationViewModel() {
  const { role } = useAuthViewModel();
  const queryClient = useQueryClient();
  const queryKey = ['owners', 'me', 'verification'];

  const query = useQuery({
    queryKey,
    queryFn: ownersRepository.getMyVerification,
    enabled: role === 'owner',
  });

  const uploadDocument = useMutation({
    mutationFn: ({ documentType, file }: { documentType: OwnerIdentityDocumentType; file: any }) =>
      ownersRepository.uploadDocument(documentType, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Self-service buyer -> owner promotion — refreshSession() picks up the
  // new role from a fresh JWT immediately, same pattern as
  // useAgencyRegistrationViewModel's register mutation, so callers don't
  // need a re-login for `role` to reflect it.
  const becomeOwner = useMutation({
    mutationFn: () => ownersRepository.becomeOwner(),
    onSuccess: () => refreshSession(),
  });

  return {
    verification: query.data,
    isLoading: query.isLoading,
    uploadDocument,
    becomeOwner,
  };
}
