import { useMutation } from '@tanstack/react-query';
import { agenciesRepository } from '../services/agenciesRepository';
import { refreshSession } from '../services/authService';
import { RegisterAgencyInput } from '../models';

// Self-service agency registration (signup's "Agency" account type) — for
// the signup page. Mirrors useAgentApplicationViewModel.ts exactly:
// refreshes the session on success so role/agentId (read from the JWT via
// useAuthViewModel) reflect the buyer -> agent flip immediately.
export function useAgencyRegistrationViewModel() {
  const register = useMutation({
    mutationFn: (input: RegisterAgencyInput) => agenciesRepository.registerSelfService(input),
    onSuccess: () => refreshSession(),
  });

  return { register };
}
